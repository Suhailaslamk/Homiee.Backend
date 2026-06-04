using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Enums;
using Homiee.Domain.Entities;
using Homiee.Application.Interfaces.IData;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Homiee.Application.Services
{
    
        public class AdminOrderService : IAdminOrderService
        {
            private readonly IOrderRepository _orderRepo;
            private readonly INotificationService _notificationService;
            private readonly ILogger<AdminOrderService> _logger;
            private readonly IApplicationDbContext _dbContext;

        private static readonly Dictionary<OrderStatus, List<OrderStatus>> AllowedTransitions =
    new()
    {
        { OrderStatus.Pending, new() { OrderStatus.Placed, OrderStatus.Accepted, OrderStatus.Rejected, OrderStatus.Cancelled } },
        { OrderStatus.Placed, new() { OrderStatus.Accepted, OrderStatus.Processing, OrderStatus.Rejected, OrderStatus.Cancelled } },
        { OrderStatus.Accepted, new() { OrderStatus.Processing, OrderStatus.Shipped, OrderStatus.Cancelled } },
        { OrderStatus.Processing, new() { OrderStatus.Shipped, OrderStatus.Delivered, OrderStatus.Cancelled } },
        { OrderStatus.Shipped, new() { OrderStatus.Delivered } },
        { OrderStatus.Delivered, new() { } },
        { OrderStatus.Rejected, new() { } },
        { OrderStatus.Cancelled, new() { } }
    };

        public AdminOrderService(IOrderRepository orderRepo, INotificationService notificationService, ILogger<AdminOrderService> logger, IApplicationDbContext dbContext)
            {
                _orderRepo = orderRepo;
            _notificationService = notificationService;
            _logger = logger;
            _dbContext = dbContext;
            }

        public async Task<ApiResponse<PagedResult<AdminOrderDto>>> GetOrders(AdminOrderQueryDto request)
        {
            var query = _orderRepo.Query().AsQueryable();

            
                if (!string.IsNullOrEmpty(request.Status))
                {
                    if (!Enum.TryParse<OrderStatus>(request.Status, true, out var status))
                        return new ApiResponse<PagedResult<AdminOrderDto>>(400,
                            $"Invalid status value '{request.Status}'. Valid values: " +
                            string.Join(", ", Enum.GetNames<OrderStatus>()));

                    query = query.Where(o => o.Status == status);
                }
            if (!string.IsNullOrWhiteSpace(request.Search) &&
    int.TryParse(request.Search, out var searchId))
                query = query.Where(o => o.Id == searchId || o.UserId == searchId);

            query = request.SortBy?.ToLower() switch
            {
                "amount" => request.Desc
                    ? query.OrderByDescending(o => o.TotalAmount)
                    : query.OrderBy(o => o.TotalAmount),
                _ => query.OrderByDescending(o => o.CreatedAt)
            };

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(o => new AdminOrderDto
                {
                    Id = o.Id,
                    UserId = o.UserId,
                    SellerId = o.SellerId,
                    TotalAmount = o.TotalAmount,
                    Status = o.Status.ToString(),
                    CreatedAt = o.CreatedAt
                })
                .ToListAsync();

            var result = new PagedResult<AdminOrderDto>(
                200,
                "Orders fetched",
                items,
                total,
                request.Page,
                request.PageSize
            );

            return new ApiResponse<PagedResult<AdminOrderDto>>(200, "Success", result);
        }

        public async Task<ApiResponse<string>> UpdateStatus(int orderId, OrderStatus status)
        {
            _logger.LogInformation("Admin attempt to override status for Order #{OrderId} to {NewStatus}", orderId, status);

            var order = await _orderRepo.GetByIdAsync(orderId);

            if (order == null)
            {
                _logger.LogWarning("Admin status update failed: Order #{OrderId} not found", orderId);
                return new ApiResponse<string>(404, "Order not found");
            }

            var currentStatus = order.Status;
            var newStatus = status;

            // 🚫 Prevent same status update
            if (currentStatus == newStatus)
            {
                _logger.LogWarning("Admin status update skipped: Order #{OrderId} already in '{CurrentStatus}' state", orderId, currentStatus);
                return new ApiResponse<string>(400, $"Order is already in '{currentStatus}' state");
            }

            // 🚫 Validate transition
            if (!AllowedTransitions.ContainsKey(currentStatus) ||
                !AllowedTransitions[currentStatus].Contains(newStatus))
            {
                _logger.LogWarning("Admin invalid transition attempt for Order #{OrderId}: {CurrentStatus} → {NewStatus}", orderId, currentStatus, newStatus);
                return new ApiResponse<string>(400,
                    $"Invalid status transition: {currentStatus} → {newStatus}");
            }

            try
            {
                order.UpdateStatus(newStatus);

                _dbContext.Set<OrderStatusHistory>().Add(new OrderStatusHistory
                {
                    OrderId = order.Id,
                    Status = newStatus,
                    CreatedOn = DateTime.UtcNow
                });

                await _orderRepo.SaveChangesAsync();
                _logger.LogInformation("Admin successfully updated Order #{OrderId} status from {OldStatus} to {NewStatus}", orderId, currentStatus, newStatus);

                await _notificationService.SendAsync(
                    order.UserId,
                    "Order Update",
                    $"Your order #{order.Id} status has been updated to {newStatus}"
                );

                return new ApiResponse<string>(200, "Order status updated by admin");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Admin failed to update Order #{OrderId} status to {NewStatus}", orderId, newStatus);
                return new ApiResponse<string>(400, ex.Message);
            }
        }
        public async Task<ApiResponse<AdminOrderDetailsDto>> GetOrderById(int orderId)
        {
            var order = await _orderRepo.GetOrderWithDetailsAsync(orderId);
                

            if (order == null)
                return new ApiResponse<AdminOrderDetailsDto>(404, "Order not found");

            var dto = new AdminOrderDetailsDto
            {
                OrderId = order.Id,
                Status = order.Status.ToString(),
                TotalAmount = order.TotalAmount,
                CreatedAt = order.CreatedAt,
                RequestedDeliveryDate = order.RequestedDeliveryDate,

                Customer = new CustomerForAdminOrderDetailsDto
                {
                    Name = order.User.Name,
                    Email = order.User.Email,
                },

                Seller = new SellerInfoForAdminOrderDetailsDto
                {
                    SellerId = order.Seller.Id,
                    BusinessName = order.Seller.BusinessName,
                    Status = order.Seller.Status.ToString()
                },

                Items = order.Items.Select(oi => new IOrderItemForAdminOrderDetailsDto
                {
                    ProductId = oi.ProductId,
                    ProductName = oi.Product.Name,
                    Quantity = oi.Quantity,
                    Price = oi.Price,
                    Total = oi.Price * oi.Quantity
                }).ToList()
            };

            return new ApiResponse<AdminOrderDetailsDto>(200, "Order details", dto);
        }
    }
    }

