using Homiee.Modules.Identity.Domain.Entities;

namespace Homiee.Modules.Identity.Application.IRepository
{
    public interface IDeliveryRepository
    {
        Task AddAsync(DeliveryPartner delivery);
        Task<DeliveryPartner?> GetByUserIdAsync(int userId);
        Task SaveChangesAsync();
    }
}
