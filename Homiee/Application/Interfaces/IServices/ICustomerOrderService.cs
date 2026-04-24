using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ICustomerOrderService
    {
        //Task<ApiResponse<string>> PlaceCodOrder(int userId, CreateOrderDto dto);

        Task<ApiResponse<string>> PlaceCodOrderFromCart(int userId, int addressId);

        //Task<ApiResponse<string>> PlaceOnlineOrderFromCart(int userId, int addressId, string razorpayPaymentId);

        Task<ApiResponse<List<CustomerOrderDto>>> GetMyOrders(int userId);
        Task<ApiResponse<OrderDetailsDto>> GetOrderById(int userId, int orderId);
        Task<ApiResponse<string>> CancelOrder(int userId, int orderId);
        Task<ApiResponse<List<OrderStatusHistoryDto>>> GetOrderStatusHistory(int userId, int orderId);
    }
}