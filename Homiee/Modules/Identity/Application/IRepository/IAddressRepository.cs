using Homiee.Modules.Identity.Domain.Entities;

namespace Homiee.Modules.Identity.Application.IRepository
{
    public interface IAddressRepository
    {
        Task<List<Address>> GetByUserIdAsync(int userId);
        Task<Address?> GetByIdAsync(int id);
        Task AddAsync(Address address);
        Task DeleteAsync(Address address);
        Task SaveChangesAsync();
    }
}
