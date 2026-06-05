using Homiee.Modules.Catalog.Domain.Entities;

namespace Homiee.Modules.Catalog.Application.IRepository
{
    public interface IProductImageRepository
    {

        Task AddAsync(ProductImage image);
        Task SaveChangesAsync();
        Task<List<ProductImage>> GetByProductIdAsync(int productId);
        Task<ProductImage?> GetByIdAsync(int id);
        Task RemoveAsync(ProductImage image);
    }
}
