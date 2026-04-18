//using Homiee.Application.DTOs;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Common;
//using Homiee.Domain.Enums;
//using Homiee.Domain.Entities;
//using Homiee.Infrastructure.Data;
//using Microsoft.EntityFrameworkCore;
//using Newtonsoft.Json;
//using Newtonsoft.Json.Linq;
//using Razorpay.Api;
//

//namespace Homiee.Application.Services
//{
//    public class PaymentService : IPaymentService
//    {
//        private readonly ICartRepository _cartRepo;
//        private readonly IConfiguration _config;
//        private readonly IPaymentRepository _paymentRepo;
//        private readonly IPendingOrderRepository _pendingRepo;
//        private readonly IOrderRepository _orderRepo;
//        private readonly IProductRepository _productRepo;
//        private readonly AppDbContext _dbContext;

//        public PaymentService(
//            ICartRepository cartRepo,
//            IConfiguration config,
//            IPaymentRepository paymentRepo,
//            IPendingOrderRepository pendingRepo,
//            IOrderRepository orderRepo,
//            IProductRepository productRepo,
//            AppDbContext dbContext)
//        {
//            _cartRepo = cartRepo;
//            _config = config;
//            _paymentRepo = paymentRepo;
//            _pendingRepo = pendingRepo;
//            _orderRepo = orderRepo;
//            _productRepo = productRepo;
//            _dbContext = dbContext;
//        }

//        // ========================
//        // INITIATE PAYMENT
//        // ========================
//        public async Task<ApiResponse<object>> InitiatePayment(int userId, int addressId)
//        {
//            var cartItems = await _cartRepo.GetCartItems(userId);

//            if (!cartItems.Any())
//                return new ApiResponse<object>(400, "Cart empty");

//            // ✅ Correct total calculation (NO CartItem.Price)
//            var productIds = cartItems.Select(x => x.ProductId).ToList();

//            var products = await _productRepo.Query()
//                .Where(p => productIds.Contains(p.Id))
//                .ToListAsync();

//            decimal total = 0;

//            foreach (var item in cartItems)
//            {
//                var product = products.FirstOrDefault(p => p.Id == item.ProductId);

//                if (product == null || product.IsDeleted)
//                    throw new Exception("Product not found");

//                total += product.Price * item.Quantity;
//            }



//            var client = new RazorpayClient(
//    _config["Razorpay:Key"],
//    _config["Razorpay:Secret"]
//);

//            var options = new Dictionary<string, object>
//{
//    { "amount", (int)Math.Round(total * 100) },
//    { "currency", "INR" },
//    { "receipt", $"rcpt_{Guid.NewGuid().ToString("N").Substring(0, 20)}" }
//};

//            var razorpayOrder = client.Order.Create(options);
//            var razorpayOrderId = razorpayOrder["id"].ToString();

//            // THEN create pending order
//            var pending = new PendingOrder
//            {
//                UserId = userId,
//                AddressId = addressId,
//                TotalAmount = total,
//                RazorpayOrderId = razorpayOrderId,
//                CartSnapshot = JsonConvert.SerializeObject(cartItems)
//            };

//            await _pendingRepo.AddAsync(pending);
//            await _pendingRepo.SaveChangesAsync();

//            return new ApiResponse<object>(200, "Payment initiated", new
//            {
//                orderId = razorpayOrderId,
//                key = _config["Razorpay:Key"],
//                amount = total
//            });
//        }





//        public async Task<ApiResponse<string>> VerifyPayment(int userId, VerifyPaymentDto dto)
//        {
//            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(dto.RazorpayOrderId);

//            if (payment == null)
//                return new ApiResponse<string>(404, "Payment not found");

//            payment.RazorpayPaymentId = dto.RazorpayPaymentId;

//            await _paymentRepo.SaveChangesAsync();

//            return new ApiResponse<string>(200, "Payment verified (await webhook)");
//        }
//        public async Task<ApiResponse<object>> GetPaymentStatus(string orderId)
//        {
//            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(orderId);

//            if (payment == null)
//                return new ApiResponse<object>(404, "Payment not found");

//            return new ApiResponse<object>(200, "Success", new
//            {
//                payment.Status,
//                payment.Amount,
//                payment.RazorpayPaymentId
//            });
//        }
//        // ========================
//        // WEBHOOK
//        // ========================
//        public async Task HandleWebhook(string json)
//        {
//            var payload = JsonConvert.DeserializeObject<JObject>(json);
//            var eventType = payload?["event"]?.ToString();

//            if (eventType != "payment.captured")
//                return;
//            var paymentEntity = payload?["payload"]?["payment"]?["entity"];

//            if (paymentEntity == null)
//                return;

//            string? paymentId = paymentEntity["id"]?.ToString();
//            string? orderId = paymentEntity["order_id"]?.ToString();

//            if (string.IsNullOrEmpty(paymentId) || string.IsNullOrEmpty(orderId))
//                return;
//            //string paymentId = payload["payload"]["payment"]["entity"]["id"];
//            //string orderId = payload["payload"]["payment"]["entity"]["order_id"];

//            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(orderId);

//            if (payment == null || payment.Status == PaymentStatus.Paid)
//                return;

//            var pending = await _pendingRepo.GetByRazorpayOrderIdAsync(orderId);

//            if (pending == null)
//                return;

//            using var transaction = await _dbContext.Database.BeginTransactionAsync();

//            try
//            {
//                payment.Status = PaymentStatus.Paid ;
//                payment.RazorpayPaymentId = paymentId;

//                var cartItems = JsonConvert.DeserializeObject<List<CartItem>>(pending.CartSnapshot)!;

//                if (!cartItems.Any())
//                    throw new Exception("Invalid cart snapshot");

//                var grouped = cartItems.GroupBy(i => i.SellerId);

//                foreach (var group in grouped)
//                {
//                    var productIds = group.Select(x => x.ProductId).ToList();

//                    var products = await _productRepo.Query()
//                        .Where(p => productIds.Contains(p.Id))
//                        .ToListAsync();

//                    var order = new DomainOrder(
//                        pending.UserId,
//                        group.Key,
//                        pending.AddressId
//                    );

//                    foreach (var item in group)
//                    {
//                        var product = products.FirstOrDefault(p => p.Id == item.ProductId);

//                        if (product == null || product.IsDeleted)
//                            throw new Exception("Product not found");

//                        if (product.Stock < item.Quantity)
//                       throw new Exception("Insufficient stock");
//                              product.ReduceStock(item.Quantity);
//                    order.AddItem(new OrderItem(
//                 product.Id,
//                 product.SellerId,
//                 item.Quantity,
//                 product.Price,
//                 product.Name
//                 ));
//                    }

//                    await _orderRepo.AddAsync(order);
//                }

//                await _orderRepo.SaveChangesAsync();

//                await _pendingRepo.DeleteAsync(pending);
//                await _pendingRepo.SaveChangesAsync();

//                await _paymentRepo.SaveChangesAsync();

//                var liveCartItems = await _cartRepo.GetCartItems(pending.UserId);
//                foreach (var ci in liveCartItems)
//                    await _cartRepo.DeleteAsync(ci);

//                await transaction.CommitAsync();
//            }
//            catch
//            {
//                await transaction.RollbackAsync();
//                throw;
//            }
//        }
//    }
//}

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
        // INITIATE PAYMENT (WITH RETRY SUPPORT)
        // ========================
        public async Task<ApiResponse<object>> InitiatePayment(int userId, int addressId)
        {
            var cartItems = await _cartRepo.GetCartItems(userId);

            if (!cartItems.Any())
                return new ApiResponse<object>(400, "Cart empty");

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

            // FIX #3: Check existing pending order but also validate the addressId matches.
            // If the user has changed their delivery address, reject the retry to avoid
            // silently using the old address.
            var existingPending = await _pendingRepo.GetByUserIdAsync(userId);

            if (existingPending != null)
            {
                if (existingPending.AddressId != addressId)
                    return new ApiResponse<object>(400,
                        "A pending payment exists for a different address. Complete or cancel it first.");

                return new ApiResponse<object>(200, "Retry existing payment", new
                {
                    orderId = existingPending.RazorpayOrderId,
                    key = _config["Razorpay:Key"],
                    amount = existingPending.TotalAmount
                });
            }

            // CREATE RAZORPAY ORDER
            var client = new RazorpayClient(
                _config["Razorpay:Key"],
                _config["Razorpay:Secret"]
            );

            var options = new Dictionary<string, object>
            {
                { "amount", (int)Math.Round(total * 100) },
                { "currency", "INR" },
                { "receipt", $"rcpt_{Guid.NewGuid().ToString("N")[..20]}" }
            };

            var razorpayOrder = client.Order.Create(options);
            var razorpayOrderId = razorpayOrder["id"].ToString();

            var payment = new DomainPayment
            {
                UserId = userId,
                Amount = total,
                Status = PaymentStatus.Pending,
                RazorpayOrderId = razorpayOrderId
            };

            await _paymentRepo.AddAsync(payment);

            var pending = new PendingOrder
            {
                UserId = userId,
                AddressId = addressId,
                TotalAmount = total,
                RazorpayOrderId = razorpayOrderId,
                CartSnapshot = JsonConvert.SerializeObject(cartItems)
            };

            await _pendingRepo.AddAsync(pending);

            // FIX #1: Single SaveChangesAsync via _dbContext instead of two separate
            // repo saves. Both repos share the same DbContext so one flush is correct
            // and avoids partial-save risk if the second call were to fail.
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<object>(200, "Payment initiated", new
            {
                orderId = razorpayOrderId,
                key = _config["Razorpay:Key"],
                amount = total
            });
        }

        // ========================
        // VERIFY PAYMENT
        // ========================
        public async Task<ApiResponse<string>> VerifyPayment(int userId, VerifyPaymentDto dto)
        {
            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(dto.RazorpayOrderId);

            if (payment == null)
                return new ApiResponse<string>(404, "Payment not found");

            // Prevent duplicate verify
            if (payment.Status == PaymentStatus.Paid)
                return new ApiResponse<string>(200, "Already verified");

            payment.RazorpayPaymentId = dto.RazorpayPaymentId;
            payment.Status = PaymentStatus.Processing;

            // FIX #1 (same principle): single flush through shared DbContext
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<string>(200, "Payment processing");
        }

        // ========================
        // PAYMENT STATUS
        // ========================
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
        // WEBHOOK (IDEMPOTENT + SAFE)
        // ========================
        public async Task HandleWebhook(string json)
        {
            var payload = JsonConvert.DeserializeObject<JObject>(json);
            var eventType = payload?["event"]?.ToString();

            if (eventType != "payment.captured")
                return;

            var paymentEntity = payload?["payload"]?["payment"]?["entity"];

            string? paymentId = paymentEntity?["id"]?.ToString();
            string? orderId = paymentEntity?["order_id"]?.ToString();

            if (paymentId == null || orderId == null)
                return;

            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(orderId);

            // IDEMPOTENCY CHECK
            if (payment == null || payment.Status == PaymentStatus.Paid)
                return;

            var pending = await _pendingRepo.GetByRazorpayOrderIdAsync(orderId);

            if (pending == null)
                return;

            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            try
            {
                payment.Status = PaymentStatus.Paid;
                payment.RazorpayPaymentId = paymentId;

                var cartItems = JsonConvert.DeserializeObject<List<CartItem>>(pending.CartSnapshot)!;

                var grouped = cartItems.GroupBy(i => i.SellerId);

                foreach (var group in grouped)
                {
                    var productIds = group.Select(x => x.ProductId).ToList();

                    var products = await _productRepo.Query()
                        .Where(p => productIds.Contains(p.Id))
                        .ToListAsync();

                    var order = new DomainOrder(pending.UserId, group.Key, pending.AddressId);

                    foreach (var item in group)
                    {
                        var product = products.First(p => p.Id == item.ProductId);

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

                // FIX #6: CartItems and PendingOrder are tracked directly on _dbContext.
                // We must remove them before the single SaveChangesAsync so they are
                // included in the same flush as orders and the payment status update.
                var liveCartItems = await _cartRepo.GetCartItems(pending.UserId);
                _dbContext.CartItems.RemoveRange(liveCartItems);
                _dbContext.PendingOrders.Remove(pending);

                // FIX #2: Single SaveChangesAsync for the entire unit of work.
                // All mutations above — orders, payment status, cart removal, pending
                // order removal — are tracked on the same DbContext and flushed once,
                // inside the transaction. No more multiple partial saves.
                await _dbContext.SaveChangesAsync();

                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task<ApiResponse<object>> RetryPayment(string orderId)
        {
            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(orderId);

            if (payment == null)
                return new ApiResponse<object>(404, "Payment not found");

            if (payment.Status == PaymentStatus.Paid)
                return new ApiResponse<object>(400, "Payment already completed");

            var pending = await _pendingRepo.GetByRazorpayOrderIdAsync(orderId);

            if (pending == null)
                return new ApiResponse<object>(404, "Pending order not found");

            return new ApiResponse<object>(200, "Retry payment", new
            {
                orderId = payment.RazorpayOrderId,
                key = _config["Razorpay:Key"],
                amount = payment.Amount
            });
        }

        public async Task<ApiResponse<object>> GetPendingPayment(int userId)
        {
            var pending = await _pendingRepo.GetByUserIdAsync(userId);

            if (pending == null)
                return new ApiResponse<object>(404, "No pending payment");

            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(pending.RazorpayOrderId);

            return new ApiResponse<object>(200, "Pending payment found", new
            {
                orderId = pending.RazorpayOrderId,
                amount = pending.TotalAmount,
                status = payment?.Status ?? PaymentStatus.Pending
            });
        }
    }
}