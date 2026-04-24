using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Application.Services
{
    public class CustomerOrderService : ICustomerOrderService
    {
        private readonly IOrderRepository _orderRepo;
        private readonly IProductRepository _productRepo;
        private readonly ICartRepository _cartRepo;
        private readonly IAddressRepository _addressRepo;
        private readonly AppDbContext _dbContext;
        private readonly INotificationService _notificationService;
        private readonly IWishlistService _wishlistService;
        private readonly IUserRepository _userRepo;

        public CustomerOrderService(
            IOrderRepository orderRepo,
            IProductRepository productRepo,
            AppDbContext dbContext,
            ICartRepository cartRepo,
            IAddressRepository addressRepo,
            INotificationService notificationService,
            IWishlistService wishlistService,
            IUserRepository userRepo)
        {
            _orderRepo = orderRepo;
            _productRepo = productRepo;
            _dbContext = dbContext;
            _cartRepo = cartRepo;
            _addressRepo = addressRepo;
            _notificationService = notificationService;
            _wishlistService = wishlistService;
            _userRepo = userRepo;

        }

        public async Task<ApiResponse<string>> PlaceCodOrderFromCart(int userId, int addressId)
        {
            var cartItems = await _cartRepo.GetCartItems(userId);
            if (!cartItems.Any())
                return new ApiResponse<string>(400, "Cart is empty");

            var address = await _addressRepo.GetByIdAsync(addressId);
            if (address == null || address.UserId != userId)
                return new ApiResponse<string>(400, "Invalid address");
            
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                return new ApiResponse<string>(404, "User not found");

            if(user.Role == UserRole.Admin)
                return new ApiResponse<string>(400, "Admin cannot place orders");


            // ── Validate ALL cart items before opening the transaction ─────
            var productMap = new Dictionary<int, Product>();
            foreach (var item in cartItems)
            {
                var product = await _productRepo.GetByIdWithImagesAsync(item.ProductId);
                if (product.SellerId == userId)
                    return new ApiResponse<string>(400, "You cannot buy your own product");
                if (product == null || product.IsDeleted)
                    return new ApiResponse<string>(404, $"Product {item.ProductId} not found");
                if (product.Stock < item.Quantity)
                    return new ApiResponse<string>(400, $"Not enough stock for '{product.Name}'");
                productMap[item.ProductId] = product;

               
            }

            using var tx = await _dbContext.Database.BeginTransactionAsync();
            var notifySellerIds = new List<int>();

            try
            {
                var grouped = cartItems.GroupBy(i => i.SellerId);

                foreach (var group in grouped)
                {
                    var order = new Order(userId, group.Key, addressId, PaymentMethod.COD);
                   
                    foreach (var item in group)
                    {
                        var product = productMap[item.ProductId];
                        product.ReduceStock(item.Quantity);
                        order.AddItem(new OrderItem(
    product.Id, product.SellerId,
    item.Quantity, product.Price,
    product.Name ?? "Unknown"));
                    }

                    order.UpdateStatus(OrderStatus.Placed);
                    await _orderRepo.AddAsync(order);

                    _dbContext.Set<OrderStatusHistory>().Add(new OrderStatusHistory
                    {
                        Order = order,
                        Status = OrderStatus.Placed,
                        CreatedOn = DateTime.UtcNow
                    });

                    notifySellerIds.Add(group.Key);
                }

                // ── Clear cart atomically inside the transaction ──────────
                _dbContext.Set<CartItem>().RemoveRange(cartItems);

                await _dbContext.SaveChangesAsync();
                await tx.CommitAsync();
            }
            catch (Exception ex)
            {
                await tx.RollbackAsync();
                return new ApiResponse<string>(500, ex.Message);
            }

            // Post-commit side-effects
            await _wishlistService.ClearWishlist(userId);

            foreach (var sellerId in notifySellerIds.Distinct())
                await _notificationService.SendAsync(sellerId, "New Order", "You received a new order");

            return new ApiResponse<string>(200, "COD order placed successfully");
        }

        public async Task<ApiResponse<List<CustomerOrderDto>>> GetMyOrders(int userId)
        {
            var orders = await _orderRepo.Query()
                .Where(o => o.UserId == userId)
                .Include(o => o.Items)
    .ThenInclude(i => i.Product)
        .ThenInclude(p => p.Images)
                .Include(o => o.Seller)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new CustomerOrderDto
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    PaymentMethod = o.PaymentMethod.ToString(),
                    SellerId = o.SellerId,
                    ShopName = o.Seller != null ? o.Seller.BusinessName : null,// enum → string for DTO
                    CreatedAt = o.CreatedAt,
                    Items = o.Items.Select(i => new CustomerOrderItemDto
                    {
                        ProductId = i.ProductId,
                        ProductName = i.Product != null ? i.Product.Name : i.ProductName,
                        Quantity = i.Quantity,
                        Price = i.Price,
                        ImageUrl = i.Product != null
    ? i.Product.Images
        .Where(img => img.IsPrimary)
        .Select(img => img.ImageUrl)
        .FirstOrDefault()
    : null
                    }).ToList()
                })
                .ToListAsync();

            return new ApiResponse<List<CustomerOrderDto>>(200, "Orders fetched", orders);
        }

        public async Task<ApiResponse<OrderDetailsDto>> GetOrderById(int userId, int orderId)
        {
            var order = await _orderRepo.Query()
                .Include(o => o.Items)
    .ThenInclude(i => i.Product)
        .ThenInclude(p => p.Images)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null)
                return new ApiResponse<OrderDetailsDto>(404, "Order not found");

            return new ApiResponse<OrderDetailsDto>(200, "Success", new OrderDetailsDto
            {
                Id = order.Id,
                TotalAmount = order.TotalAmount,
                Status = order.Status.ToString(),
                CreatedAt = order.CreatedAt,
                Items = order.Items.Select(i => new GetOrderItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.Product?.Name ?? i.ProductName,
                    Price = i.Price,
                    Quantity = i.Quantity,
                    ImageUrl = i.Product != null
    ? i.Product.Images
        .Where(img => img.IsPrimary)
        .Select(img => img.ImageUrl)
        .FirstOrDefault()
    : null
                }).ToList()
            });
        }

        public async Task<ApiResponse<string>> CancelOrder(int userId, int orderId)
        {
            var order = await _orderRepo.GetByIdAsync(orderId);

            if (order == null || order.UserId != userId)
                return new ApiResponse<string>(404, "Order not found");

            if (order.Status == OrderStatus.Delivered)
                return new ApiResponse<string>(400, "Cannot cancel a delivered order");

            if (order.Status == OrderStatus.Cancelled)
                return new ApiResponse<string>(400, "Order is already cancelled");

            order.UpdateStatus(OrderStatus.Cancelled);

            _dbContext.Set<OrderStatusHistory>().Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                Status = OrderStatus.Cancelled,
                CreatedOn = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            await _notificationService.SendAsync(
                order.SellerId,
                "Order Cancelled",
                $"Order #{order.Id} was cancelled by the customer");

            return new ApiResponse<string>(200, "Order cancelled");
        }

        public async Task<ApiResponse<List<OrderStatusHistoryDto>>> GetOrderStatusHistory(
            int userId, int orderId)
        {
            var order = await _orderRepo.Query()
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null)
                return new ApiResponse<List<OrderStatusHistoryDto>>(404, "Order not found");

            var history = await _dbContext.Set<OrderStatusHistory>()
                .Where(h => h.OrderId == orderId)
                .OrderBy(h => h.CreatedOn)
                .Select(h => new OrderStatusHistoryDto
                {
                    Status = h.Status.ToString(),
                    CreatedAt = h.CreatedOn
                })
                .ToListAsync();

            return new ApiResponse<List<OrderStatusHistoryDto>>(200, "History fetched", history);
        }
    }
}