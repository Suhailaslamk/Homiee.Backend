using Homiee.Modules.Orders.Application.Dtos;
using Homiee.Shared.Common;
using Homiee.Shared.Domain.Enums;

namespace Homiee.Modules.Orders.Application.IServices
{
    public interface ISellerOrderService
    {
        Task<ApiResponse<PagedResult<SellerOrderDto>>> GetOrders(int userId, OrderQueryDto query);
        Task<ApiResponse<string>> UpdateStatus(int orderId,int userId, OrderStatus status);
        Task<ApiResponse<SellerOrderGetDetailsDto>> GetOrderById(int orderId, int userId);
        Task<ApiResponse<List<OrderStatusHistoryDto>>> GetOrderTracking(int orderId, int userId);
        Task<ApiResponse<List<DeliveryCalendarDto>>> GetDeliveryCalendar(int userId, int month, int year);
    }
}
