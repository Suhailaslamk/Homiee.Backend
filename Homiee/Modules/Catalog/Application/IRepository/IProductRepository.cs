using Homiee.Modules.Catalog.Domain.Entities;

namespace Homiee.Modules.Catalog.Application.IRepository
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
