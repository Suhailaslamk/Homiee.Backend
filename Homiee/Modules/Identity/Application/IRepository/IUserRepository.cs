using Homiee.Modules.Identity.Domain.Entities;

namespace Homiee.Modules.Identity.Application.IRepository
{
    public interface IUserRepository
    {
        Task<bool> ExistsByEmailAsync(string email);
        Task AddAsync(User user);

        public IQueryable<User> Query();
        Task<User?> GetByEmailAsync(string email);
        Task<User?> GetByIdAsync(int id);
        Task SaveChangesAsync();
    }
}
