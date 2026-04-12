using Homiee.Application.DTOs;
using Homiee.Common;
using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IPaymentService
    {
        //Task CreateOrderFromSnapshot(int userId, int addressId, List<CartItem> items);
        Task<ApiResponse<string>> VerifyPayment(int userId, VerifyPaymentDto dto);
        Task<ApiResponse<object>> InitiatePayment(int userId, int addressId);
        Task<ApiResponse<object>> GetPaymentStatus(string orderId);


        Task HandleWebhook(string json);
    }
}
