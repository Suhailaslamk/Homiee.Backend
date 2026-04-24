//using Homiee.Application.DTOs;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Common;
//using Homiee.Domain.Entities;
//using Homiee.Domain.Enums;
//using Homiee.Infrastructure.Data;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.Extensions.Configuration;
//using Newtonsoft.Json;
//using Newtonsoft.Json.Linq;
//using Razorpay.Api;
//using DomainOrder = Homiee.Domain.Entities.Order;
//using DomainPayment = Homiee.Domain.Entities.Payment;

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
//        private readonly INotificationService _notificationService;
//        private readonly AppDbContext _dbContext;

//        public PaymentService(
//            ICartRepository cartRepo,
//            IConfiguration config,
//            IPaymentRepository paymentRepo,
//            IPendingOrderRepository pendingRepo,
//            IOrderRepository orderRepo,
//            IProductRepository productRepo,
//            INotificationService notificationService,
//            AppDbContext dbContext)
//        {
//            _cartRepo = cartRepo;
//            _config = config;
//            _paymentRepo = paymentRepo;
//            _pendingRepo = pendingRepo;
//            _orderRepo = orderRepo;
//            _productRepo = productRepo;
//            _notificationService = notificationService;
//            _dbContext = dbContext;
//        }

//        // ═══════════════════════════════════════════════════════════════════
//        // STEP 1 — INITIATE PAYMENT
//        // Creates a Razorpay order + saves PendingOrder + Payment records.
//        // ─────────────────────────────────────────────────────────────────
//        // Duplicate-prevention:
//        //   If a PendingOrder already exists for this user with the same
//        //   addressId, return it instead of creating a new Razorpay order.
//        //   This handles the "back button / double-tap" scenario safely.
//        // ═══════════════════════════════════════════════════════════════════
//        public async Task<ApiResponse<object>> InitiatePayment(int userId, int addressId)
//        {
//            var cartItems = await _cartRepo.GetCartItems(userId);
//            if (!cartItems.Any())
//                return new ApiResponse<object>(400, "Cart is empty");

//            // ── Compute total from live product prices, not cart ──────────
//            var productIds = cartItems.Select(x => x.ProductId).ToList();
//            var products = await _productRepo.Query()
//                                               .Where(p => productIds.Contains(p.Id))
//                                               .ToListAsync();

//            decimal total = 0;
//            foreach (var item in cartItems)
//            {
//                var product = products.FirstOrDefault(p => p.Id == item.ProductId);
//                if (product == null || product.IsDeleted)
//                    return new ApiResponse<object>(404, $"Product {item.ProductId} not found");
//                total += product.Price * item.Quantity;
//            }

//            // ── DUPLICATE-PREVENTION: return existing pending if address matches ──
//            var existingPending = await _pendingRepo.GetByUserIdAsync(userId);
//            if (existingPending != null)
//            {
//                if (existingPending.AddressId != addressId)
//                    return new ApiResponse<object>(400,
//                        "A pending payment already exists for a different address. " +
//                        "Complete or cancel it first.");

//                // Idempotent retry — give the client the same Razorpay order
//                return new ApiResponse<object>(200, "Retry existing payment", new
//                {
//                    orderId = existingPending.RazorpayOrderId,
//                    key = _config["Razorpay:Key"],
//                    amount = existingPending.TotalAmount
//                });
//            }

//            // ── Create new Razorpay order ─────────────────────────────────
//            var client = new RazorpayClient(
//                _config["Razorpay:Key"],
//                _config["Razorpay:Secret"]);

//            var options = new Dictionary<string, object>
//            {
//                { "amount",   (int)Math.Round(total * 100) },
//                { "currency", "INR" },
//                { "receipt",  $"rcpt_{Guid.NewGuid():N}"[..28] }
//            };

//            var razorpayOrder = client.Order.Create(options);
//            var razorpayOrderId = razorpayOrder["id"].ToString();

//            // ── Persist Payment + PendingOrder atomically ─────────────────
//            var payment = new DomainPayment
//            {
//                UserId = userId,
//                Amount = total,
//                Status = PaymentStatus.Pending,
//                RazorpayOrderId = razorpayOrderId,
//                Provider = "Razorpay",
//                CreatedAt = DateTime.UtcNow
//            };
//            await _paymentRepo.AddAsync(payment);

//            var pending = new PendingOrder
//            {
//                UserId = userId,
//                AddressId = addressId,
//                TotalAmount = total,
//                RazorpayOrderId = razorpayOrderId,
//                CartSnapshot = JsonConvert.SerializeObject(cartItems)
//            };
//            await _pendingRepo.AddAsync(pending);

//            // Single flush — both entities share the same DbContext
//            await _dbContext.SaveChangesAsync();

//            return new ApiResponse<object>(200, "Payment initiated", new
//            {
//                orderId = razorpayOrderId,
//                key = _config["Razorpay:Key"],
//                amount = total
//            });
//        }

//        // ═══════════════════════════════════════════════════════════════════
//        // STEP 2 — VERIFY & STORE PAYMENT ID (called by frontend after popup)
//        // Does NOT create any order. Just marks the payment as Processing and
//        // stores the Razorpay paymentId for the webhook / signature validation.
//        // ═══════════════════════════════════════════════════════════════════
//        public async Task<ApiResponse<string>> VerifyAndStorePaymentId(int userId, VerifyPaymentDto dto)
//        {
//            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(dto.RazorpayOrderId);
//            if (payment == null)
//                return new ApiResponse<string>(404, "Payment not found");

//            if (payment.UserId != userId)
//                return new ApiResponse<string>(403, "Forbidden");

//            // Idempotency — don't overwrite if already Paid
//            if (payment.Status == PaymentStatus.Paid)
//                return new ApiResponse<string>(200, "Payment already completed");

//            payment.RazorpayPaymentId = dto.RazorpayPaymentId;
//            payment.Status = PaymentStatus.Processing;

//            await _dbContext.SaveChangesAsync();

//            return new ApiResponse<string>(200, "Payment received, awaiting confirmation");
//        }

//        // ═══════════════════════════════════════════════════════════════════
//        // STEP 3 — WEBHOOK (the only place Online orders are created)
//        // ─────────────────────────────────────────────────────────────────
//        // Duplicate-prevention:
//        //   payment.Status == Paid check at the top is the idempotency gate.
//        //   Any repeat webhook for the same Razorpay orderId hits that check
//        //   and returns immediately — no duplicate orders, no double stock deduction.
//        //   PendingOrder is deleted inside the same transaction so a second
//        //   concurrent webhook call will find pending == null and return.
//        // ═══════════════════════════════════════════════════════════════════
//        public async Task HandleWebhook(string json)
//        {
//            var payload = JsonConvert.DeserializeObject<JObject>(json);
//            var eventType = payload?["event"]?.ToString();

//            // Only handle payment captures
//            if (eventType != "payment.captured")
//                return;

//            var entity = payload?["payload"]?["payment"]?["entity"];
//            var paymentId = entity?["id"]?.ToString();
//            var orderId = entity?["order_id"]?.ToString();

//            if (string.IsNullOrEmpty(paymentId) || string.IsNullOrEmpty(orderId))
//                return;

//            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(orderId);

//            // ── IDEMPOTENCY GATE ─────────────────────────────────────────
//            if (payment == null || payment.Status == PaymentStatus.Paid)
//                return;

//            var pending = await _pendingRepo.GetByRazorpayOrderIdAsync(orderId);
//            if (pending == null)
//                return;  // PendingOrder already consumed (duplicate webhook)

//            // ── Deserialize cart snapshot ─────────────────────────────────
//            var cartItems = JsonConvert.DeserializeObject<List<CartItem>>(pending.CartSnapshot);
//            if (cartItems == null || !cartItems.Any())
//                return;

//            using var tx = await _dbContext.Database.BeginTransactionAsync();
//            var notifySellerIds = new List<int>();

//            try
//            {
//                // Mark payment as Paid
//                payment.Status = PaymentStatus.Paid;
//                payment.RazorpayPaymentId = paymentId;

//                var grouped = cartItems.GroupBy(i => i.SellerId);

//                foreach (var group in grouped)
//                {
//                    var productIds = group.Select(x => x.ProductId).ToList();
//                    var products = await _productRepo.Query()
//                                                       .Where(p => productIds.Contains(p.Id))
//                                                       .ToListAsync();

//                    // ── Create Online order (enum, not string) ────────────
//                    var order = new DomainOrder(
//                        pending.UserId,
//                        group.Key,
//                        pending.AddressId,
//                        PaymentMethod.Online);          // ✅ ENUM

//                    order.SetRazorpayPaymentId(paymentId);

//                    foreach (var item in group)
//                    {
//                        var product = products.FirstOrDefault(p => p.Id == item.ProductId)
//                            ?? throw new Exception($"Product {item.ProductId} not found");

//                        if (product.Stock < item.Quantity)
//                            throw new Exception($"Insufficient stock for '{product.Name}'");

//                        product.ReduceStock(item.Quantity);

//                        order.AddItem(new OrderItem(
//                            product.Id,
//                            product.SellerId,
//                            item.Quantity,
//                            product.Price,
//                            product.Name ?? "Unknown"));
//                    }

//                    order.UpdateStatus(OrderStatus.Placed);
//                    await _orderRepo.AddAsync(order);

//                    _dbContext.Set<OrderStatusHistory>().Add(new OrderStatusHistory
//                    {
//                        Order = order,
//                        Status = OrderStatus.Placed,
//                        CreatedOn = DateTime.UtcNow
//                    });

//                    notifySellerIds.Add(group.Key);
//                }

//                // ── Clear live cart + remove PendingOrder atomically ──────
//                var liveCartItems = await _cartRepo.GetCartItems(pending.UserId);
//                _dbContext.CartItems.RemoveRange(liveCartItems);
//                _dbContext.PendingOrders.Remove(pending);

//                // Single flush — all mutations in one transaction
//                await _dbContext.SaveChangesAsync();
//                await tx.CommitAsync();
//            }
//            catch
//            {
//                await tx.RollbackAsync();
//                throw;
//            }

//            // Notify sellers AFTER commit
//            foreach (var sellerId in notifySellerIds.Distinct())
//                await _notificationService.SendAsync(sellerId, "New Order", "You received a new order");
//        }

//        // ═══════════════════════════════════════════════════════════════════
//        // HELPERS
//        // ═══════════════════════════════════════════════════════════════════

//        public async Task<ApiResponse<object>> GetPaymentStatus(string razorpayOrderId)
//        {
//            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(razorpayOrderId);
//            if (payment == null)
//                return new ApiResponse<object>(404, "Payment not found");

//            return new ApiResponse<object>(200, "Success", new
//            {
//                payment.Status,
//                payment.Amount,
//                payment.RazorpayPaymentId
//            });
//        }

//        public async Task<ApiResponse<object>> RetryPayment(string razorpayOrderId)
//        {
//            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(razorpayOrderId);
//            if (payment == null)
//                return new ApiResponse<object>(404, "Payment not found");

//            if (payment.Status == PaymentStatus.Paid)
//                return new ApiResponse<object>(400, "Payment already completed");

//            var pending = await _pendingRepo.GetByRazorpayOrderIdAsync(razorpayOrderId);
//            if (pending == null)
//                return new ApiResponse<object>(404, "Pending order not found");

//            return new ApiResponse<object>(200, "Retry payment", new
//            {
//                orderId = payment.RazorpayOrderId,
//                key = _config["Razorpay:Key"],
//                amount = payment.Amount
//            });
//        }

//        public async Task<ApiResponse<object>> GetPendingPayment(int userId)
//        {
//            var pending = await _pendingRepo.GetByUserIdAsync(userId);
//            if (pending == null)
//                return new ApiResponse<object>(404, "No pending payment");

//            var payment = await _paymentRepo.GetByRazorpayOrderIdAsync(pending.RazorpayOrderId);

//            return new ApiResponse<object>(200, "Pending payment found", new
//            {
//                orderId = pending.RazorpayOrderId,
//                amount = pending.TotalAmount,
//                status = payment?.Status ?? PaymentStatus.Pending
//            });
//        }
//    }
//}