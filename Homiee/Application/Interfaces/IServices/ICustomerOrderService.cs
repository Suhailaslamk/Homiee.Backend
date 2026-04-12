using Homiee.Application.DTOs;
using Homiee.Common;
using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ICustomerOrderService
    {


        Task<ApiResponse<string>> CreateOrder(int userId, int addressId, CreateOrderDto dto);
        Task<ApiResponse<List<CustomerOrderDto>>> GetMyOrders(int userId);
        Task<ApiResponse<string>> CreateOrderFromCart(int userId, int addressId);
        Task<ApiResponse<OrderDetailsDto>> GetOrderById(int userId, int orderId);
        Task<ApiResponse<string>> CancelOrder(int userId, int orderId);
    }
}
