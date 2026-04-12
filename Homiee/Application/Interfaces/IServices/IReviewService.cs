using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IReviewService
    {
        Task<ApiResponse<string>> AddReview(int userId, int productId, CreateReviewDto dto);
        Task<ApiResponse<List<ReviewDto>>> GetReviews(int productId);
    }
}
