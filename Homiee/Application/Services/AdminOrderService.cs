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

            public AdminOrderService(IOrderRepository orderRepo)
            {
                _orderRepo = orderRepo;
            }

        public async Task<ApiResponse<PagedResult<AdminOrderDto>>> GetOrders(AdminOrderQueryDto request)
        {
            var query = _orderRepo.Query().AsQueryable();

            if (!string.IsNullOrEmpty(request.Status))
            {
                if (Enum.TryParse<OrderStatus>(request.Status, true, out var status))
                    query = query.Where(o => o.Status == status);
            }

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

        public async Task<ApiResponse<string>> UpdateStatus(int orderId, string status)
            {
                var order = await _orderRepo.GetByIdAsync(orderId);

                if (order == null)
                    return new ApiResponse<string>(404, "Order not found");

                if (!Enum.TryParse<OrderStatus>(status, true, out var newStatus))
                    return new ApiResponse<string>(400, "Invalid status");

                try
                {
                    order.UpdateStatus(newStatus);
                    await _orderRepo.SaveChangesAsync();

                    return new ApiResponse<string>(200, "Order status updated by admin");
                }
                catch (Exception ex)
                {
                    return new ApiResponse<string>(400, ex.Message);
                }
            }
        }
    }

