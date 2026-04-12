using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
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
