using Homiee.Modules.Orders.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Orders.Application.IServices
{
    public interface ICustomerOrderService
    {
        //Task<ApiResponse<string>> PlaceCodOrder(int userId, CreateOrderDto dto);

        Task<ApiResponse<string>> PlaceCodOrderFromCart(int userId, int addressId, DateTime? requestedDeliveryDate = null);

        //Task<ApiResponse<string>> PlaceOnlineOrderFromCart(int userId, int addressId, string razorpayPaymentId);

        Task<ApiResponse<List<CustomerOrderDto>>> GetMyOrders(int userId);
        Task<ApiResponse<OrderDetailsDto>> GetOrderById(int userId, int orderId);
        Task<ApiResponse<string>> CancelOrder(int userId, int orderId);
        Task<ApiResponse<List<OrderStatusHistoryDto>>> GetOrderStatusHistory(int userId, int orderId);
    }
}