using Homiee.Modules.Catalog.Domain.Entities;

namespace Homiee.Modules.Catalog.Application.IRepository
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
