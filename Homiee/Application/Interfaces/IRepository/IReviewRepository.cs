using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface IReviewRepository
    {
        Task AddAsync(Review review);
        Task<List<Review>> GetByProductId(int productId);
        Task<bool> Exists(int userId, int productId);
        Task SaveChangesAsync();
    }
}
