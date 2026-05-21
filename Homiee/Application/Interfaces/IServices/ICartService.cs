using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ICartService
    {
        Task<ApiResponse<string>> AddToCart(int customerId, AddToCartDto dto);
        Task<ApiResponse<List<CartItemDto>>> GetCart(int customerId);
        Task<ApiResponse<string>> RemoveFromCart(int customerId, int productId, int? variantId = null);
    }
}
