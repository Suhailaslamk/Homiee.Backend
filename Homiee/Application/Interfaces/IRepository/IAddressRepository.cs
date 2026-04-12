using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
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
