using Homiee.Modules.Cart.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Cart.Application.IServices
{
    public interface ICartService
    {
        Task<ApiResponse<string>> AddToCart(int customerId, AddToCartDto dto);
        Task<ApiResponse<List<CartItemDto>>> GetCart(int customerId);
        Task<ApiResponse<string>> RemoveFromCart(int customerId, int productId, int? variantId = null);
    }
}
