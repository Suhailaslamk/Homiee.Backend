using Homiee.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface IProductRepository
    {
        Task AddAsync(Product product);
        Task<Product?> GetByIdAsync(int id);
        IQueryable<Product> Query();
        Task SaveChangesAsync();
        Task<List<Product>> GetCandidatesForRecommendationAsync(
            int categoryId,
            int sellerId,
            CancellationToken cancellationToken = default);

        Task<Product> GetByIdWithImagesAsync(int id);
    }
}
