//using Homiee.Application.DTOs;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Common;
//using Homiee.Domain.Entities;
//using Homiee.Domain.Enums;
//using Homiee.Infrastructure.Data;
//using Homiee.Infrastructure.Repositories;
//using Microsoft.EntityFrameworkCore;

//namespace Homiee.Application.Services
//{
//    public class CustomerOrderService : ICustomerOrderService
//    {
//        private readonly IOrderRepository _orderRepo;
//        private readonly IProductRepository _productRepo;
//        private readonly ICartRepository _cartRepo;
//        private readonly IAddressRepository _addressRepo;
//        private readonly AppDbContext _dbContext;
//        private readonly INotificationService _notificationService;



//        public CustomerOrderService(
//            IOrderRepository orderRepo,
//            IProductRepository productRepo, AppDbContext dbContext, ICartRepository cartRepo, IAddressRepository addressRepo, INotificationService notificationService)
//        {
//            _orderRepo = orderRepo;
//            _productRepo = productRepo;
//            _dbContext = dbContext;
//            _cartRepo = cartRepo;
//            _addressRepo = addressRepo;
//            _notificationService = notificationService;
//        }

//        public async Task<ApiResponse<string>> CreateOrder(int userId, int addressId, CreateOrderDto dto)
//        {
//            if (dto == null || dto.Items == null || !dto.Items.Any())
//                return new ApiResponse<string>(400, "Order must contain at least one item");
//            var address = await _addressRepo.GetByIdAsync(addressId);
//            if (address == null || address.UserId != userId)
//                return new ApiResponse<string>(400, "Invalid address");
//            try
//            {
//                var productMap = new Dictionary<int, Product>();


//                foreach (var item in dto.Items)
//                {
//                    var product = await _productRepo.GetByIdAsync(item.ProductId);

//                    if (product == null || product.IsDeleted)
//                        return new ApiResponse<string>(404, $"Product {item.ProductId} not found");

//                    if (product.Stock < item.Quantity)
//                        return new ApiResponse<string>(400, $"Not enough stock for {product.Name}");

//                    productMap[item.ProductId] = product;
//                }


//                using var transaction = await _dbContext.Database.BeginTransactionAsync();

//                // 🔥 GROUP BY SELLER
//                var grouped = dto.Items.GroupBy(i => productMap[i.ProductId].SellerId);

//                foreach (var sellerGroup in grouped)
//                {
//                    decimal totalAmount = 0;

//                    foreach (var item in sellerGroup)
//                    {
//                        var product = productMap[item.ProductId];
//                        totalAmount += product.Price * item.Quantity;
//                    }
//                    // ✅ FIXED constructor
//                    var order = new Order(userId, sellerGroup.Key, addressId);

//                    foreach (var item in sellerGroup)
//                    {
//                        if (!productMap.TryGetValue(item.ProductId, out var product))
//                            throw new Exception("Product not found in map");

//                        product.ReduceStock(item.Quantity);

//                        var orderItem = new OrderItem(
//                            product.Id,
//                            product.SellerId,
//                            item.Quantity,
//                            product.Price,
//                            product.Name ?? "Unknown"
//                        );

//                        order.AddItem(orderItem);
//                    }

//                    order.Status = OrderStatus.Placed;
//                    await _orderRepo.AddAsync(order);

//                    _context.OrderStatusHistories.Add(new OrderStatusHistory
//                    {
//                        OrderId = order.Id,
//                        Status = "Placed"
//                    });
//                    await _notificationService.SendAsync(
//                         order.SellerId,
//                         "New Order",
//                         "You received a new order"
//                     );
//                }

//                await _orderRepo.SaveChangesAsync();
//                await transaction.CommitAsync();
//                return new ApiResponse<string>(200, "Orders placed successfully");
//            }
//            catch (Exception ex)
//            {
//                return new ApiResponse<string>(500, ex.Message);
//            }
//        }

//        public async Task<ApiResponse<List<CustomerOrderDto>>> GetMyOrders(int userId)
//        {
//            var orders = await _orderRepo.Query()
//                .Where(o => o.UserId == userId)
//                .Include(o => o.Items)
//                .ThenInclude(i => i.Product)
//                .OrderByDescending(o => o.CreatedAt)
//                .Select(o => new CustomerOrderDto
//                {
//                    Id = o.Id,
//                    TotalAmount = o.TotalAmount,
//                    Status = o.Status.ToString(),
//                    CreatedAt = o.CreatedAt,
//                    Items = o.Items.Select(i => new CustomerOrderItemDto
//                    {
//                        ProductId = i.ProductId,
//                        ProductName = i.Product.Name,
//                        Quantity = i.Quantity,
//                        Price = i.Price
//                    }).ToList()
//                })
//                .ToListAsync();

//            return new ApiResponse<List<CustomerOrderDto>>(200, "Orders fetched", orders);
//        }
//        public async Task<ApiResponse<OrderDetailsDto>> GetOrderById(int userId, int orderId)
//        {
//            var order = await _orderRepo.Query()
//                .Include(o => o.Items)
//                    .ThenInclude(i => i.Product)
//                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

//            if (order == null)
//                return new ApiResponse<OrderDetailsDto>(404, "Order not found");

//            var dto = new OrderDetailsDto
//            {
//                Id = order.Id,
//                TotalAmount = order.TotalAmount,
//                Status = order.Status.ToString(),
//                CreatedAt = order.CreatedAt,
//                Items = order.Items.Select(i => new OrderItemDto
//                {
//                    ProductId = i.ProductId,
//                    ProductName = i.Product != null ? i.Product.Name : "Unknown",
//                    Price = i.Price,
//                    Quantity = i.Quantity
//                }).ToList()
//            };

//            return new ApiResponse<OrderDetailsDto>(200, "Success", dto);
//        }
//        public async Task<ApiResponse<string>> CancelOrder(int userId, int orderId)
//        {
//            var order = await _orderRepo.GetByIdAsync(orderId);

//            if (order == null || order.UserId != userId)
//                return new ApiResponse<string>(404, "Order not found");

//            // 🚨 Important business rule
//            if (order.Status == OrderStatus.Delivered)
//                return new ApiResponse<string>(400, "Cannot cancel delivered order");

//            if (order.Status == OrderStatus.Cancelled)
//                return new ApiResponse<string>(400, "Already cancelled");

//            order.UpdateStatus(OrderStatus.Cancelled);

//            await _orderRepo.SaveChangesAsync();

//            return new ApiResponse<string>(200, "Order cancelled");
//        }
//        public async Task<ApiResponse<string>> CreateOrderFromCart(int userId, int addressId)
//        {
//            var cartItems = await _cartRepo.GetCartItems(userId);

//            if (!cartItems.Any())
//                return new ApiResponse<string>(400, "Cart is empty");

//            var address = await _addressRepo.GetByIdAsync(addressId);
//            if (address == null || address.UserId != userId)
//                return new ApiResponse<string>(400, "Invalid address");

//            using var transaction = await _dbContext.Database.BeginTransactionAsync();

//            try
//            {
//                var productMap = new Dictionary<int, Product>();

//                foreach (var item in cartItems)
//                {
//                    var product = await _productRepo.GetByIdAsync(item.ProductId);

//                    if (product == null || product.IsDeleted)
//                        return new ApiResponse<string>(404, $"Product {item.ProductId} not found");

//                    if (product.Stock < item.Quantity)
//                        return new ApiResponse<string>(400, $"Not enough stock for {product.Name}");

//                    productMap[item.ProductId] = product;
//                }

//                var grouped = cartItems.GroupBy(i => i.SellerId);

//                foreach (var group in grouped)
//                {
//                    decimal total = 0;

//                    foreach (var item in group)
//                    {
//                        var product = productMap[item.ProductId];
//                        total += product.Price * item.Quantity;
//                    }

//                    var order = new Order(userId, group.Key,  addressId);

//                    foreach (var item in group)
//                    {
//                        if (!productMap.TryGetValue(item.ProductId, out var product))
//                            throw new Exception("Product not found in map");

//                        product.ReduceStock(item.Quantity);

//                        var orderItem = new OrderItem(
//                            product.Id,
//                            product.SellerId,
//                            item.Quantity,
//                            product.Price,
//                            product.Name ?? "Unknown"
//                        );

//                        order.AddItem(orderItem);
//                    }

//                    await _orderRepo.AddAsync(order);
//                }

//                foreach (var item in cartItems)
//                {
//                    await _cartRepo.DeleteAsync(item);
//                }

//                await _orderRepo.SaveChangesAsync();
//                await transaction.CommitAsync();

//                return new ApiResponse<string>(200, "Order placed successfully");
//            }
//            catch (Exception ex)
//            {
//                await transaction.RollbackAsync();
//                return new ApiResponse<string>(500, ex.Message);
//            }
//        }
//    }
//}





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

        public CustomerOrderService(
            IOrderRepository orderRepo,
            IProductRepository productRepo,
            AppDbContext dbContext,
            ICartRepository cartRepo,
            IAddressRepository addressRepo,
            INotificationService notificationService)
        {
            _orderRepo = orderRepo;
            _productRepo = productRepo;
            _dbContext = dbContext;
            _cartRepo = cartRepo;
            _addressRepo = addressRepo;
            _notificationService = notificationService;
        }

        // ========================
        // CREATE ORDER (DIRECT)
        // ========================
        public async Task<ApiResponse<string>> CreateOrder(int userId, int addressId, CreateOrderDto dto)
        {
            if (dto == null || dto.Items == null || !dto.Items.Any())
                return new ApiResponse<string>(400, "Order must contain at least one item");

            var address = await _addressRepo.GetByIdAsync(addressId);
            if (address == null || address.UserId != userId)
                return new ApiResponse<string>(400, "Invalid address");

            // FIX #4: Validate ALL items BEFORE opening the transaction so we never
            // return early from inside a transaction without an explicit rollback.
            var productMap = new Dictionary<int, Product>();

            foreach (var item in dto.Items)
            {
                var product = await _productRepo.GetByIdAsync(item.ProductId);

                if (product == null || product.IsDeleted)
                    return new ApiResponse<string>(404, $"Product {item.ProductId} not found");

                if (product.Stock < item.Quantity)
                    return new ApiResponse<string>(400, $"Not enough stock for {product.Name}");

                productMap[item.ProductId] = product;
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            try
            {
                var grouped = dto.Items.GroupBy(i => productMap[i.ProductId].SellerId);
                var sellerIds = new List<int>();

                foreach (var sellerGroup in grouped)
                {
                    var order = new Order(userId, sellerGroup.Key, addressId);

                    foreach (var item in sellerGroup)
                    {
                        var product = productMap[item.ProductId];
                        product.ReduceStock(item.Quantity);

                        order.AddItem(new OrderItem(
                            product.Id,
                            product.SellerId,
                            item.Quantity,
                            product.Price,
                            product.Name ?? "Unknown"
                        ));
                    }

                    order.UpdateStatus(OrderStatus.Placed);
                    await _orderRepo.AddAsync(order);

                    _dbContext.Set<OrderStatusHistory>().Add(new OrderStatusHistory
                    {
                        Order = order,
                        Status = "Placed"
                    });

                    sellerIds.Add(order.SellerId);
                }

                // FIX (same as PaymentService): single SaveChangesAsync via _dbContext
                // flushes orders, stock reductions, and status histories in one shot.
                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                // Notifications AFTER commit — never inside a transaction
                foreach (var sellerId in sellerIds.Distinct())
                {
                    await _notificationService.SendAsync(
                        sellerId,
                        "New Order",
                        "You received a new order"
                    );
                }

                return new ApiResponse<string>(200, "Orders placed successfully");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new ApiResponse<string>(500, ex.Message);
            }
        }

        // ========================
        // GET MY ORDERS
        // ========================
        public async Task<ApiResponse<List<CustomerOrderDto>>> GetMyOrders(int userId)
        {
            var orders = await _orderRepo.Query()
                .Where(o => o.UserId == userId)
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new CustomerOrderDto
                {
                    Id = o.Id,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    CreatedAt = o.CreatedAt,
                    Items = o.Items.Select(i => new CustomerOrderItemDto
                    {
                        ProductId = i.ProductId,
                        ProductName = i.Product.Name,
                        Quantity = i.Quantity,
                        Price = i.Price
                    }).ToList()
                })
                .ToListAsync();

            return new ApiResponse<List<CustomerOrderDto>>(200, "Orders fetched", orders);
        }

        // ========================
        // GET ORDER BY ID
        // ========================
        public async Task<ApiResponse<OrderDetailsDto>> GetOrderById(int userId, int orderId)
        {
            var order = await _orderRepo.Query()
                .Include(o => o.Items)
                .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null)
                return new ApiResponse<OrderDetailsDto>(404, "Order not found");

            var dto = new OrderDetailsDto
            {
                Id = order.Id,
                TotalAmount = order.TotalAmount,
                Status = order.Status.ToString(),
                CreatedAt = order.CreatedAt,
                Items = order.Items.Select(i => new OrderItemDto
                {
                    ProductId = i.ProductId,
                    ProductName = i.Product != null ? i.Product.Name : "Unknown",
                    Price = i.Price,
                    Quantity = i.Quantity
                }).ToList()
            };

            return new ApiResponse<OrderDetailsDto>(200, "Success", dto);
        }

        // ========================
        // CANCEL ORDER
        // ========================
        public async Task<ApiResponse<string>> CancelOrder(int userId, int orderId)
        {
            var order = await _orderRepo.GetByIdAsync(orderId);

            if (order == null || order.UserId != userId)
                return new ApiResponse<string>(404, "Order not found");

            if (order.Status == OrderStatus.Delivered)
                return new ApiResponse<string>(400, "Cannot cancel delivered order");

            if (order.Status == OrderStatus.Cancelled)
                return new ApiResponse<string>(400, "Already cancelled");

            order.UpdateStatus(OrderStatus.Cancelled);

            _dbContext.Set<OrderStatusHistory>().Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                Status = "Cancelled"
            });

            // FIX #5: Was _orderRepo.SaveChangesAsync() which would NOT flush the
            // OrderStatusHistory added directly on _dbContext above.
            // Single _dbContext.SaveChangesAsync() flushes both in one call.
            await _dbContext.SaveChangesAsync();

            return new ApiResponse<string>(200, "Order cancelled");
        }

        // ========================
        // CREATE FROM CART
        // ========================
        public async Task<ApiResponse<string>> CreateOrderFromCart(int userId, int addressId)
        {
            var cartItems = await _cartRepo.GetCartItems(userId);

            if (!cartItems.Any())
                return new ApiResponse<string>(400, "Cart is empty");

            var address = await _addressRepo.GetByIdAsync(addressId);
            if (address == null || address.UserId != userId)
                return new ApiResponse<string>(400, "Invalid address");

            // FIX #4: Same pattern — validate everything before opening the transaction
            var productMap = new Dictionary<int, Product>();

            foreach (var item in cartItems)
            {
                var product = await _productRepo.GetByIdAsync(item.ProductId);

                if (product == null || product.IsDeleted)
                    return new ApiResponse<string>(404, $"Product {item.ProductId} not found");

                if (product.Stock < item.Quantity)
                    return new ApiResponse<string>(400, $"Not enough stock for {product.Name}");

                productMap[item.ProductId] = product;
            }

            using var transaction = await _dbContext.Database.BeginTransactionAsync();

            try
            {
                var grouped = cartItems.GroupBy(i => i.SellerId);

                foreach (var group in grouped)
                {
                    var order = new Order(userId, group.Key, addressId);

                    foreach (var item in group)
                    {
                        var product = productMap[item.ProductId];
                        product.ReduceStock(item.Quantity);

                        order.AddItem(new OrderItem(
                            product.Id,
                            product.SellerId,
                            item.Quantity,
                            product.Price,
                            product.Name ?? "Unknown"
                        ));
                    }

                    order.UpdateStatus(OrderStatus.Placed);
                    await _orderRepo.AddAsync(order);
                }

                // FIX #3: Replace per-item _cartRepo.DeleteAsync loop with a single
                // bulk RemoveRange directly on _dbContext. Avoids N round-trips and
                // ensures cart removal is part of the same transaction flush.
                _dbContext.CartItems.RemoveRange(cartItems);

                // Single SaveChangesAsync flushes orders, stock, and cart removal together
                await _dbContext.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ApiResponse<string>(200, "Order placed successfully");
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return new ApiResponse<string>(500, ex.Message);
            }
        }

        // ========================
        // GET ORDER STATUS HISTORY
        // ========================
        public async Task<ApiResponse<List<OrderStatusHistoryDto>>> GetOrderStatusHistory(int userId, int orderId)
        {
            // Verify the order belongs to this user before exposing history
            var order = await _orderRepo.Query()
                .FirstOrDefaultAsync(o => o.Id == orderId && o.UserId == userId);

            if (order == null)
                return new ApiResponse<List<OrderStatusHistoryDto>>(404, "Order not found");

            var history = await _dbContext.Set<OrderStatusHistory>()
                .Where(h => h.OrderId == orderId)
                .OrderBy(h => h.CreatedOn)
                .Select(h => new OrderStatusHistoryDto
                {
                    Status = h.Status,
                    CreatedAt = h.CreatedOn
                })
                .ToListAsync();

            return new ApiResponse<List<OrderStatusHistoryDto>>(200, "History fetched", history);
        }
    }
}