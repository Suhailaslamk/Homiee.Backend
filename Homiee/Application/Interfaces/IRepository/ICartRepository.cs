using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface ICartRepository
    {
        Task<List<CartItem>> GetCartItems(int customerId);
        Task<CartItem?> GetCartItem(int customerId, int productId);
        Task AddAsync(CartItem item);
        Task UpdateAsync(CartItem item);
        Task DeleteAsync(CartItem item);
        IQueryable<CartItem> Query();
    }
}
