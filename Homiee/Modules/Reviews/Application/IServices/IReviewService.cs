using Homiee.Modules.Reviews.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Reviews.Application.IServices
{
    public interface IReviewService
    {
        Task<ApiResponse<string>> AddReview(int userId, int productId, CreateReviewDto dto);
        Task<ApiResponse<List<ReviewDto>>> GetReviews(int productId);
    }
}
