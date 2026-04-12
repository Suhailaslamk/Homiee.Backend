using Homiee.Application.DTOs;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ICartService
    {
        Task AddToCart(int customerId, AddToCartDto dto);
        Task<List<CartItemDto>> GetCart(int customerId);
        Task RemoveFromCart(int customerId, int productId);
    }
}
