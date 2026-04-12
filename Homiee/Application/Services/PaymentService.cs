using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Enums;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Razorpay.Api;
using DomainOrder = Homiee.Domain.Entities.Order;
using DomainPayment = Homiee.Domain.Entities.Payment;

namespace Homiee.Application.Services
{
    public class PaymentService : IPaymentService
    {
        private readonly ICartRepository _cartRepo;
        private readonly IConfiguration _config;
        private readonly IPaymentRepository _paymentRepo;
        private readonly IPendingOrderRepository _pendingRepo;
        private readonly IOrderRepository _orderRepo;
        private readonly IProductRepository _productRepo;
        private readonly AppDbContext _dbContext;

        public PaymentService(
            ICartRepository cartRepo,
            IConfiguration config,
            IPaymentRepository paymentRepo,
            IPendingOrderRepository pendingRepo,
            IOrderRepository orderRepo,
            IProductRepository productRepo,
            AppDbContext dbContext)
        {
            _cartRepo = cartRepo;
            _config = config;
            _paymentRepo = paymentRepo;
            _pendingRepo = pendingRepo;
            _orderRepo = orderRepo;
            _productRepo = productRepo;
            _dbContext = dbContext;
        }

        // ========================
        // INITIATE PAYMENT
        // ========================
        public async Task<ApiResponse<object>> InitiatePayment(int userId, int addressId)
        {
            var cartItems = await _cartRepo.GetCartItems(userId);

            if (!cartItems.Any())
                return new ApiResponse<object>(400, "Cart empty");

            // ✅ Correct total calculation (NO CartItem.Price)
            var productIds = cartItems.Select(x => x.ProductId).ToList();

            var products = await _productRepo.Query()
                .Where(p => productIds.Contains(p.Id))
                .ToListAsync();

            decimal total = 0;

            foreach (var item in cartItems)
            {
                var product = products.FirstOrDefault(p => p.Id == item.ProductId);

                if (product == null || product.IsDeleted)
                    throw new Exception("Product not found");

                total += product.Price * item.Quantity;
            }

            // Create Pending Order
            var pending = new PendingOrder
            {
                UserId = userId,
                AddressId = addressId,
                TotalAmount = total,
                CartSnapshot = JsonConvert.SerializeObject(cartItems)
            };

            await _pendingRepo.AddAsync(pending);
            await _pendingRepo.SaveChangesAsync();

            // Razorpay Order
            var client = new RazorpayClient(
                _config["Razorpay:Key"],
                _config["Razorpay:Secret"]
            );

            var options = new Dictionary<string, object>
            {
                { "amount", (int)Math.Round(total * 100) },
                { "currency", "INR" },
                { "receipt", $"order_rcpt_{pending.Id}" }
            };

            var razorpayOrder = client.Order.Create(options);
            var razorpayOrderId = razorpayOrder["id"].ToString();

            pending.RazorpayOrderId = razorpayOrderId;
            await _pendingRepo.SaveChangesAsync();

            // Payment entry
            var payment = new DomainPayment
            {
                UserId = userId,
                Amount = total,
                RazorpayOrderId = razorpayOrderId,
                Status = PaymentStatus.Pending,
                Provider = "Razorpay"
            };

            await _paymentRepo.AddAsync(payment);
            await _paymentRepo.SaveChangesAsync();

            return new ApiResponse<object>(200, "Payment initiated", new
            {
                orderId = razorpayOrderId,
                key = _config["Razorpay:Key"],
                amount = total
            });
        }

        // ========================
        // VERIFY (OPTIONAL)
        // ========================
        public async Task<ApiResponse<string>> VerifyPayment(int userId, VerifyPaymentDto dto)
        {
            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(dto.RazorpayOrderId);

            if (payment == null)
                return new ApiResponse<string>(404, "Payment not found");

            payment.RazorpayPaymentId = dto.RazorpayPaymentId;

            await _paymentRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Payment verified (await webhook)");
        }
        public async Task<ApiResponse<object>> GetPaymentStatus(string orderId)
        {
            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(orderId);

            if (payment == null)
                return new ApiResponse<object>(404, "Payment not found");

            return new ApiResponse<object>(200, "Success", new
            {
                payment.Status,
                payment.Amount,
                payment.RazorpayPaymentId
            });
        }
        // ========================
        // WEBHOOK
        // ========================
        public async Task HandleWebhook(string json)
        {
            var payload = JsonConvert.DeserializeObject<JObject>(json);
            var eventType = payload?["event"]?.ToString();

            if (eventType != "payment.captured")
                return;
            var paymentEntity = payload?["payload"]?["payment"]?["entity"];

            if (paymentEntity == null)
                return;

            string? paymentId = paymentEntity["id"]?.ToString();
            string? orderId = paymentEntity["order_id"]?.ToString();

            if (string.IsNullOrEmpty(paymentId) || string.IsNullOrEmpty(orderId))
                return;
            //string paymentId = payload["payload"]["payment"]["entity"]["id"];
            //string orderId = payload["payload"]["payment"]["entity"]["order_id"];

            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(orderId);

            if (payment == null || payment.Status == PaymentStatus.Success)
                return;

            var pending = await _pendingRepo.GetByRazorpayOrderIdAsync(orderId);

            if (pending == null)
                return;

            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            try
            {
                payment.Status = PaymentStatus.Success ;
                payment.RazorpayPaymentId = paymentId;

                var cartItems = JsonConvert.DeserializeObject<List<CartItem>>(pending.CartSnapshot)!;

                if (!cartItems.Any())
                    throw new Exception("Invalid cart snapshot");

                var grouped = cartItems.GroupBy(i => i.SellerId);

                foreach (var group in grouped)
                {
                    var productIds = group.Select(x => x.ProductId).ToList();

                    var products = await _productRepo.Query()
                        .Where(p => productIds.Contains(p.Id))
                        .ToListAsync();

                    var order = new DomainOrder(
                        pending.UserId,
                        group.Key,
                        pending.AddressId
                    );

                    foreach (var item in group)
                    {
                        var product = products.FirstOrDefault(p => p.Id == item.ProductId);

                        if (product == null || product.IsDeleted)
                            throw new Exception("Product not found");

                        if (product.Stock < item.Quantity)
                            throw new Exception("Insufficient stock");

                                 product.ReduceStock(item.Quantity);

                        order.AddItem(new OrderItem(
product.Id,
product.SellerId,
item.Quantity,
product.Price,
product.Name
));
                    }

                    await _orderRepo.AddAsync(order);
                }

                await _orderRepo.SaveChangesAsync();

                await _pendingRepo.DeleteAsync(pending);
                await _pendingRepo.SaveChangesAsync();

                await _paymentRepo.SaveChangesAsync();

                var liveCartItems = await _cartRepo.GetCartItems(pending.UserId);
                foreach (var ci in liveCartItems)
                    await _cartRepo.DeleteAsync(ci);

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}