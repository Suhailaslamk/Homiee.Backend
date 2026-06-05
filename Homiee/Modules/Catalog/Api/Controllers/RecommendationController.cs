using Homiee.Modules.Catalog.Application.IServices;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Modules.Catalog.Api.Controllers
{
    [ApiController]
    [Route("api/products")]
    public class ProductRecommendationController : ControllerBase
    {
        private readonly IRecommendationService _recommendationService;

        public ProductRecommendationController(IRecommendationService recommendationService)
        {
            _recommendationService = recommendationService;
        }

        
        [HttpGet("{productId:int}/recommendations")]
        public async Task<IActionResult> GetRecommendations(
            int productId,
            [FromQuery] int topN = 10,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var results = await _recommendationService.GetRecommendationsAsync(
                    productId, topN, cancellationToken);
                return Ok(results);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
        }
    }
}