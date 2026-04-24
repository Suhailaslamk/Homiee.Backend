
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
    public class SellerOrderService : ISellerOrderService
    {
        private readonly IOrderRepository _orderRepo;
        private readonly ISellersRepository _sellerRepo;
        private readonly AppDbContext _dbContext;
        private readonly INotificationService _notificationService;
        private readonly ISellerEarningService _earningService;
        private static readonly Dictionary<OrderStatus, List<OrderStatus>> AllowedTransitions =
new()
{
    { OrderStatus.Pending, new() { OrderStatus.Placed, OrderStatus.Cancelled } },

    { OrderStatus.Placed, new() { OrderStatus.Accepted, OrderStatus.Rejected } },

    { OrderStatus.Accepted, new() { OrderStatus.Processing } },

    { OrderStatus.Processing, new() { OrderStatus.Shipped } },

    { OrderStatus.Shipped, new() { OrderStatus.Delivered } },

    { OrderStatus.Delivered, new() { } },

    { OrderStatus.Rejected, new() { } },

    { OrderStatus.Cancelled, new() { } }
};
        public SellerOrderService(
            IOrderRepository orderRepo,
            ISellersRepository sellerRepo,
            AppDbContext dbContext,
            INotificationService notificationService,
            ISellerEarningService earningService)
        {
            _orderRepo = orderRepo;
            _sellerRepo = sellerRepo;
            _dbContext = dbContext;
            _notificationService = notificationService;
            _earningService = earningService;
        }

        public async Task<ApiResponse<PagedResult<SellerOrderDto>>> GetOrders(
            int userId, OrderQueryDto queryDto)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<PagedResult<SellerOrderDto>>(404, "Seller not found");

            var query = _orderRepo.Query()
                .Where(o => o.SellerId == seller.Id);

            if (!string.IsNullOrEmpty(queryDto.Status))
            {
                if (Enum.TryParse<OrderStatus>(queryDto.Status, true, out var status))
                    query = query.Where(o => o.Status == status);
            }

            var total = await query.CountAsync();
            var sid = seller.Id;
            var items = await query
    .OrderByDescending(o => o.CreatedAt)
    .Skip((queryDto.Page - 1) * queryDto.PageSize)
    .Take(queryDto.PageSize)
    .Include(o => o.Items).ThenInclude(i => i.Product)
    .Include(o => o.User)
    .Select(o => new SellerOrderDto
    {
        Id = o.Id,
        TotalAmount = o.TotalAmount,
        Status = o.Status.ToString(),
        CreatedAt = o.CreatedAt,
        CustomerName = o.User != null ? o.User.Name : null,
        ItemCount = o.Items.Count(i => i.SellerId == sid),
        Items = o.Items
                         .Where(i => i.SellerId == sid)
                         .Select(i => new SellerOrderItemsDto
                         {
                             ProductId = i.ProductId,
                             ProductName = i.Product != null ? i.Product.Name : i.ProductName,
                             Quantity = i.Quantity,
                             Price = i.Price
                         }).ToList()
    })
    .ToListAsync();

            return new ApiResponse<PagedResult<SellerOrderDto>>(200, "Orders fetched",
                new PagedResult<SellerOrderDto>(200, "Success", items, total,
                    queryDto.Page, queryDto.PageSize));
        }

        

        public async Task<ApiResponse<string>> UpdateStatus(int orderId, int userId, OrderStatus newStatus)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            var order = await _orderRepo.GetByIdAsync(orderId);
            if (order == null)
                return new ApiResponse<string>(404, "Order not found");

            if (order.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");

            if (!AllowedTransitions.ContainsKey(order.Status) ||
    !AllowedTransitions[order.Status].Contains(newStatus))
            {
                return new ApiResponse<string>(400,
                    $"Invalid transition from {order.Status} to {newStatus}");
            }
            // Sellers cannot cancel
            if (newStatus == OrderStatus.Cancelled)
                return new ApiResponse<string>(403, "Sellers cannot cancel orders");
            if (newStatus == OrderStatus.Rejected)
            {
                order.UpdateStatus(OrderStatus.Rejected);

                await _notificationService.SendAsync(
                    order.UserId,
                    "Order Rejected",
                    $"Your order #{order.Id} was rejected by the seller");

                return new ApiResponse<string>(200, "Order rejected");
            }
            order.UpdateStatus(newStatus);

            _dbContext.Set<OrderStatusHistory>().Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                Status = newStatus,
                //Status = newStatus.ToString()
                // assuming DB stores string
                CreatedOn = DateTime.UtcNow
            });

            await _dbContext.SaveChangesAsync();

            await _notificationService.SendAsync(
                order.UserId,
                "Order Update",
                $"Your order #{order.Id} is now: {newStatus}");

            if (newStatus == OrderStatus.Delivered)
            {
                await _earningService.CreateEarningForOrder(
                    seller.Id, order.Id, order.TotalAmount);
                await _earningService.ReleaseEarnings(userId);
            }

            return new ApiResponse<string>(200, "Order status updated");
        }

        public async Task<ApiResponse<SellerOrderGetDetailsDto>> GetOrderById(
            int orderId, int userId)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<SellerOrderGetDetailsDto>(404, "Seller not found");

            var order = await _orderRepo.Query()
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .Include(o => o.User)
                .Include(o => o.Address)
                .FirstOrDefaultAsync(o => o.Id == orderId);

            if (order == null)
                return new ApiResponse<SellerOrderGetDetailsDto>(404, "Order not found");

            var sellerItems = order.Items.Where(i => i.SellerId == seller.Id).ToList();
            if (!sellerItems.Any())
                return new ApiResponse<SellerOrderGetDetailsDto>(403, "Unauthorized");

            return new ApiResponse<SellerOrderGetDetailsDto>(200, "Success",
                new SellerOrderGetDetailsDto
                {
                    OrderId = order.Id,
                    Status = order.Status.ToString(),
                    TotalAmount = sellerItems.Sum(i => i.Price * i.Quantity),
                    CreatedAt = order.CreatedAt,
                    CustomerName = order.User.Name,
                    CustomerEmail = order.User.Email,
                    ShippingFullName = order.Address?.FullName,
                    ShippingPhone = order.Address?.Phone,
                    ShippingLine1 = order.Address?.Line1,
                    ShippingCity = order.Address?.City,
                    ShippingState = order.Address?.State,
                    ShippingPincode = order.Address?.Pincode,
                    Items = sellerItems.Select(i => new SellerOrderItemsDto
                    {
                        ProductId = i.ProductId,
                        ProductName = i.Product?.Name ?? i.ProductName,
                        Quantity = i.Quantity,
                        Price = i.Price
                    }).ToList()
                });
        }

        // Step 6: full tracking history for an order (seller-owned only)
        public async Task<ApiResponse<List<OrderStatusHistoryDto>>> GetOrderTracking(
            int orderId, int userId)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<List<OrderStatusHistoryDto>>(404, "Seller not found");

            var order = await _orderRepo.GetByIdAsync(orderId);
            if (order == null)
                return new ApiResponse<List<OrderStatusHistoryDto>>(404, "Order not found");

            if (order.SellerId != seller.Id)
                return new ApiResponse<List<OrderStatusHistoryDto>>(403, "Unauthorized");

            var history = await _dbContext.Set<OrderStatusHistory>()
                .Where(h => h.OrderId == orderId)
                .OrderBy(h => h.CreatedOn)
                .Select(h => new OrderStatusHistoryDto
                {
                    Status = h.Status.ToString(),
                    CreatedAt = h.CreatedOn
                })
                .ToListAsync();

            return new ApiResponse<List<OrderStatusHistoryDto>>(200, "Success", history);
        }
    }
}