using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Homiee.Infrastructure.Data;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Razorpay.Api;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IPaymentService
    {




        Task<ApiResponse<object>> InitiatePayment(int userId, int addressId);

        Task<ApiResponse<string>> VerifyPayment(int userId, VerifyPaymentDto dto);
        Task<ApiResponse<object>> GetPaymentStatus(string orderId);


                  Task HandleWebhook(string json);

        Task<ApiResponse<object>> RetryPayment(string orderId);

        Task<ApiResponse<object>> GetPendingPayment(int userId);
            
    }
}

