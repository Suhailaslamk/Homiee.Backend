using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IPaymentService
    {
        
        Task<ApiResponse<object>> InitiatePayment(int userId, int addressId);

        
        Task<ApiResponse<string>> VerifyAndStorePaymentId(int userId, VerifyPaymentDto dto);

        
        Task HandleWebhook(string json);

        Task<ApiResponse<object>> GetPaymentStatus(string razorpayOrderId);
        Task<ApiResponse<object>> RetryPayment(string razorpayOrderId);
        Task<ApiResponse<object>> GetPendingPayment(int userId);
    }
}