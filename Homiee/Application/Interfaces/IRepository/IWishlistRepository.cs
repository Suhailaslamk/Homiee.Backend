using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface IWishlistRepository
    {
        Task<bool> ExistsAsync(int userId, int productId);
        Task AddAsync(Wishlist wishlist);
        Task RemoveAsync(Wishlist wishlist);
        Task<Wishlist?> GetAsync(int userId, int productId);
        Task<List<Wishlist>> GetByUserIdAsync(int userId);
        Task RemoveRangeAsync(List<Wishlist> items);
        Task<int> SaveChangesAsync();
    }
}
