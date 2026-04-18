using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Homiee.Infrastructure.Data;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ICustomerOrderService
    {


             Task<ApiResponse<string>> CreateOrder(int userId, int addressId, CreateOrderDto dto);
             Task<ApiResponse<List<CustomerOrderDto>>> GetMyOrders(int userId);
             Task<ApiResponse<OrderDetailsDto>> GetOrderById(int userId, int orderId);
             Task<ApiResponse<string>> CancelOrder(int userId, int orderId);

             Task<ApiResponse<string>> CreateOrderFromCart(int userId, int addressId);
             Task<ApiResponse<List<OrderStatusHistoryDto>>> GetOrderStatusHistory(int userId, int orderId);
    }
}

