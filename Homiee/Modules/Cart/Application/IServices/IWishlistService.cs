using Homiee.Modules.Cart.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Cart.Application.IServices
{
    public interface IWishlistService
    {
        Task<ApiResponse<string>> AddToWishlist(int userId, int productId);
        Task<ApiResponse<string>> RemoveFromWishlist(int userId, int productId);
        Task<ApiResponse<List<WishlistItemDto>>> GetMyWishlist(int userId);
        Task<ApiResponse<string>> ClearWishlist(int userId);
    }
}