using Homiee.Modules.Reviews.Domain.Entities;

namespace Homiee.Modules.Reviews.Application.IRepositories
{
    public interface IReviewRepository
    {
        Task AddAsync(Review review);
        Task<List<Review>> GetByProductId(int productId);
        Task<bool> Exists(int userId, int productId);
        Task SaveChangesAsync();
    }
}
