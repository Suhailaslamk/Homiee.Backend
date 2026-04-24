using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Application.Services
{
    
        public class AdminOrderService : IAdminOrderService
        {
            private readonly IOrderRepository _orderRepo;
            private readonly INotificationService _notificatiService;

        private static readonly Dictionary<OrderStatus, List<OrderStatus>> AllowedTransitions =
    new()
    {
        { OrderStatus.Pending, new() { OrderStatus.Placed, OrderStatus.Cancelled } },
        { OrderStatus.Placed, new() { OrderStatus.Processing, OrderStatus.Cancelled } },
        { OrderStatus.Processing, new() { OrderStatus.Shipped, OrderStatus.Cancelled } },
        { OrderStatus.Shipped, new() { OrderStatus.Delivered } },
        { OrderStatus.Delivered, new() { } }, // terminal
        { OrderStatus.Cancelled, new() { } }  // terminal
    };

        public AdminOrderService(IOrderRepository orderRepo, INotificationService notificatiService)
            {
                _orderRepo = orderRepo;
            _notificatiService = notificatiService;
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
            var order = await _orderRepo.GetByIdAsync(orderId);

            if (order == null)
                return new ApiResponse<string>(404, "Order not found");

            var currentStatus = order.Status;
            var newStatus = status;

            // 🚫 Prevent same status update
            if (currentStatus == newStatus)
                return new ApiResponse<string>(400, $"Order is already in '{currentStatus}' state");

            // 🚫 Validate transition
            if (!AllowedTransitions.ContainsKey(currentStatus) ||
                !AllowedTransitions[currentStatus].Contains(newStatus))
            {
                return new ApiResponse<string>(400,
                    $"Invalid status transition: {currentStatus} → {newStatus}");
            }

            try
            {
                order.UpdateStatus(newStatus);
                await _orderRepo.SaveChangesAsync();

                await _notificatiService.SendAsync(
                    order.UserId,
                    "Order Update",
                    $"Your order #{order.Id} status has been updated to {newStatus}"
                );

                return new ApiResponse<string>(200, "Order status updated by admin");
            }
            catch (Exception ex)
            {
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
                PaymentMethod = order.PaymentMethod.ToString(),
                CreatedAt = order.CreatedAt,

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

