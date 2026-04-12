using Homiee.Domain.Entities;


namespace Homiee.Application.Interfaces.IRepository
{
    public interface IPaymentRepository
    {
        Task AddAsync(Payment payment);
        Task<Payment?> GetByIdAsync(int id);
        Task<Payment?> GetByGatewayIdAsync(string gatewayId);
        Task<List<Payment>> GetByUserIdAsync(int userId);
        Task<Payment?> GetByRazorpayOrderIdAsync(string razorpayOrderId);

        Task SaveChangesAsync();
    }
}
