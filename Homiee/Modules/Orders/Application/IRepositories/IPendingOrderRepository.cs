using Homiee.Modules.Orders.Domain.Entities;

namespace Homiee.Modules.Orders.Application.IRepositories
{
    public interface IPendingOrderRepository
    {
        Task AddAsync(PendingOrder pendingOrder);
        Task<PendingOrder?> GetByIdAsync(int id);
        Task<PendingOrder?> GetByUserIdAsync(int userId);

        Task DeleteAsync(PendingOrder pendingOrder);
        Task<PendingOrder?> GetByRazorpayOrderIdAsync(string razorpayOrderId);

        Task SaveChangesAsync();
    }
}
