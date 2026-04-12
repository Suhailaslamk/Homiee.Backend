using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface ICategoryRepository
    {
        Task AddAsync(Category category);
        Task<Category?> GetByIdAsync(int id);
        Task<Category?> GetByNameAsync(string name);
        IQueryable<Category> Query();
        Task SaveChangesAsync();
    }
}
