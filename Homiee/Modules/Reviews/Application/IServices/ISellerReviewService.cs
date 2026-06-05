using Homiee.Modules.Reviews.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Reviews.Application.IServices
{
    public interface ISellerReviewService
    {
        Task<ApiResponse<string>> AddSellerReview(int userId, int sellerId, CreateSellerReviewDto dto);
        Task<ApiResponse<List<SellerReviewDto>>> GetSellerReviews(int sellerId);
    }
}