using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ISellerReviewService
    {
        Task<ApiResponse<string>> AddSellerReview(int userId, int sellerId, CreateSellerReviewDto dto);
        Task<ApiResponse<List<SellerReviewDto>>> GetSellerReviews(int sellerId);
    }
}