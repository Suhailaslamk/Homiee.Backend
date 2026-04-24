using Homiee.Common;
using Homiee.Application.DTOs;
using Homiee.Domain.Enums;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ISellerOrderService
    {
        Task<ApiResponse<PagedResult<SellerOrderDto>>> GetOrders(int userId, OrderQueryDto query);
        Task<ApiResponse<string>> UpdateStatus(int orderId,int userId, OrderStatus status);
        Task<ApiResponse<SellerOrderGetDetailsDto>> GetOrderById(int orderId, int userId);
        Task<ApiResponse<List<OrderStatusHistoryDto>>> GetOrderTracking(int orderId, int userId);
    }
}
