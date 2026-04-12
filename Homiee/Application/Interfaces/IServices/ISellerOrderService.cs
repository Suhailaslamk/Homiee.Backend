using Homiee.Common;
using Homiee.Application.DTOs;  

namespace Homiee.Application.Interfaces.IServices
{
    public interface ISellerOrderService
    {
        Task<ApiResponse<PagedResult<SellerOrderDto>>> GetOrders(int userId, OrderQueryDto query);
        Task<ApiResponse<string>> UpdateStatus(int orderId, int userId, string status);
        Task<ApiResponse<SellerOrderGetDetailsDto>> GetOrderById(int orderId, int userId);
    }
}
