using Homiee.Modules.Orders.Application.Dtos;
using Homiee.Shared.Common;
using Homiee.Shared.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Modules.Orders.Application.IServices
{
    public interface IAdminOrderService
    {
        Task<ApiResponse<PagedResult<AdminOrderDto>>> GetOrders(AdminOrderQueryDto query);
        Task<ApiResponse<string>> UpdateStatus(int orderId, OrderStatus status);
        Task<ApiResponse<AdminOrderDetailsDto>> GetOrderById(int orderId);
    }
}
