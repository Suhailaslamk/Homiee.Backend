using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface IDeliveryRepository
    {
        Task AddAsync(DeliveryPartner delivery);
        Task<DeliveryPartner?> GetByUserIdAsync(int userId);
        Task SaveChangesAsync();
    }
}
