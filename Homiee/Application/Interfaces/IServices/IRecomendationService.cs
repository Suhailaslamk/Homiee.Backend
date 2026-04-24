using Homiee.Application.DTOs;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IRecommendationService
    {
        Task<IEnumerable<RecomendationResultDto>> GetRecommendationsAsync(
            int productId,
            int topN = 10,
            CancellationToken cancellationToken = default);
    }
}
