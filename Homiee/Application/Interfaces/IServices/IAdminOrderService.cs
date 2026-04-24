using Homiee.Application.DTOs;
using Homiee.Common;
using Homiee.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IAdminOrderService
    {
        Task<ApiResponse<PagedResult<AdminOrderDto>>> GetOrders(AdminOrderQueryDto query);
        Task<ApiResponse<string>> UpdateStatus(int orderId, OrderStatus status);
        Task<ApiResponse<AdminOrderDetailsDto>> GetOrderById(int orderId);
    }
}
