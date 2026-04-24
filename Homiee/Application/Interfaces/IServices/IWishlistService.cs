using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IWishlistService
    {
        Task<ApiResponse<string>> AddToWishlist(int userId, int productId);
        Task<ApiResponse<string>> RemoveFromWishlist(int userId, int productId);
        Task<ApiResponse<List<WishlistItemDto>>> GetMyWishlist(int userId);
        Task<ApiResponse<string>> ClearWishlist(int userId);
    }
}