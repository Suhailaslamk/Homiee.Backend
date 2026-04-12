using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IAdminOrderService
    {
        Task<ApiResponse<PagedResult<AdminOrderDto>>> GetOrders(AdminOrderQueryDto query);
        Task<ApiResponse<string>> UpdateStatus(int orderId, string status);
    }
}
