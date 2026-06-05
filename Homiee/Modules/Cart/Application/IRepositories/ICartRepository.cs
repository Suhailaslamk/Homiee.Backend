using Homiee.Modules.Cart.Domain.Entities;

namespace Homiee.Modules.Cart.Application.IRepositories
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
