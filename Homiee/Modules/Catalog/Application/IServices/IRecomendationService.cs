using Homiee.Modules.Catalog.Application.Dtos;

namespace Homiee.Modules.Catalog.Application.IServices
{
    public interface IRecommendationService
    {
        Task<IEnumerable<RecomendationResultDto>> GetRecommendationsAsync(
            int productId,
            int topN = 10,
            CancellationToken cancellationToken = default);
    }
}
