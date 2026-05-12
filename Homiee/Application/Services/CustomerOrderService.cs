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
        private readonly ILogger<CustomerOrderService> _logger;

        public CustomerOrderService(
            IOrderRepository orderRepo,
            IProductRepository productRepo,
            AppDbContext dbContext,
            ICartRepository cartRepo,
            IAddressRepository addressRepo,
            INotificationService notificationService,
            IWishlistService wishlistService,
            IUserRepository userRepo,
            ILogger<CustomerOrderService> logger)
        {
            _orderRepo = orderRepo;
            _productRepo = productRepo;
            _dbContext = dbContext;
            _cartRepo = cartRepo;
            _addressRepo = addressRepo;
            _notificationService = notificationService;
            _wishlistService = wishlistService;
            _userRepo = userRepo;
            _logger = logger;
        }

        public async Task<ApiResponse<string>> PlaceCodOrderFromCart(int userId, int addressId, DateTime? requestedDeliveryDate = null)
        {
            _logger.LogInformation("Attempting to place COD order for User #{UserId} with Address #{AddressId}", userId, addressId);

            var cartItems = await _cartRepo.GetCartItems(userId);
            if (!cartItems.Any())
            {
                _logger.LogWarning("Order placement failed for User #{UserId}: Cart is empty", userId);
                return new ApiResponse<string>(400, "Cart is empty");
            }

            var address = await _addressRepo.GetByIdAsync(addressId);
            if (address == null || address.UserId != userId)
            {
                _logger.LogWarning("Order placement failed for User #{UserId}: Invalid Address #{AddressId}", userId, addressId);
                return new ApiResponse<string>(400, "Invalid address");
            }
            
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
            {
                _logger.LogWarning("Order placement failed: User #{UserId} not found", userId);
                return new ApiResponse<string>(404, "User not found");
            }

            if(user.Role == UserRole.Admin)
            {
                _logger.LogWarning("Order placement blocked: Admin User #{UserId} attempted to place an order", userId);
                return new ApiResponse<string>(400, "Admin cannot place orders");
            }


            // ── Validate ALL cart items before opening the transaction ─────
            var productMap = new Dictionary<int, Product>();
            foreach (var item in cartItems)
            {
                var product = await _productRepo.GetByIdWithImagesAsync(item.ProductId);
                if (product == null || product.IsDeleted)
                {
                    _logger.LogWarning("Order validation failed for User #{UserId}: Product #{ProductId} not found or deleted", userId, item.ProductId);
                    return new ApiResponse<string>(404, $"Product {item.ProductId} not found");
                }
                if (product.SellerId == userId)
                {
                    _logger.LogWarning("Order validation failed for User #{UserId}: Attempted to buy own product #{ProductId}", userId, item.ProductId);
                    return new ApiResponse<string>(400, "You cannot buy your own product");
                }
                if (product.Stock < item.Quantity)
                {
                    _logger.LogWarning("Order validation failed for User #{UserId}: Insufficient stock for Product '{ProductName}'", userId, product.Name);
                    return new ApiResponse<string>(400, $"Not enough stock for '{product.Name}'");
                }
                productMap[item.ProductId] = product;
            }

            using var tx = await _dbContext.Database.BeginTransactionAsync();
            var notifySellerIds = new List<int>();

            try
            {
                var grouped = cartItems.GroupBy(i => i.SellerId);

                foreach (var group in grouped)
                {
                    var order = new Order(userId, group.Key, addressId, requestedDeliveryDate);
                   
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

                    _logger.LogInformation("Created Order #{OrderId} for User #{UserId} from Seller #{SellerId}", order.Id, userId, group.Key);
                    notifySellerIds.Add(group.Key);
                }

                // ── Clear cart atomically inside the transaction ──────────
                _dbContext.Set<CartItem>().RemoveRange(cartItems);

                await _dbContext.SaveChangesAsync();
                await tx.CommitAsync();
                _logger.LogInformation("Successfully committed COD orders for User #{UserId}", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to place COD order for User #{UserId}", userId);
                await tx.RollbackAsync();
                return new ApiResponse<string>(500, ex.Message);
            }

            // Post-commit side-effects
            try 
            {
                await _wishlistService.ClearWishlist(userId);
                _logger.LogInformation("Cleared wishlist for User #{UserId} after order placement", userId);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to clear wishlist for User #{UserId} after order placement", userId);
            }

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
                    SellerId = o.SellerId,
                    ShopName = o.Seller != null ? o.Seller.BusinessName : null,// enum → string for DTO
                    CreatedAt = o.CreatedAt,
                    RequestedDeliveryDate = o.RequestedDeliveryDate,
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
                RequestedDeliveryDate = order.RequestedDeliveryDate,
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