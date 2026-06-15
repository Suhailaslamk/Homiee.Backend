using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Modules.Catalog.Application.IServices;
using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Reviews.Application.Dtos;
using Homiee.Modules.Reviews.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Modules.Catalog.Api.Controllers
{
    [ApiController]
    [Route("api/marketplace")]
    public class MarketplaceController : ControllerBase
    {
        private readonly IMarketplaceQueryService _service;
        private readonly IReviewService _reviewService;
        private readonly IRecommendationService _recommendationService;

        public MarketplaceController(
            IMarketplaceQueryService service,
            IReviewService reviewService,
            IRecommendationService recommendationService)
        {
            _service = service;
            _reviewService = reviewService;
            _recommendationService = recommendationService;
        }

        

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
            => Ok(await _service.GetCategories());

        
        [HttpGet("products")]
        public async Task<IActionResult> GetProducts([FromQuery] ProductQuery query)
            => Ok(await _service.GetProducts(query));

        [HttpGet("products/{id}")]
        public async Task<IActionResult> GetProduct(int id)
            => Ok(await _service.GetProductById(id));

        [HttpGet("sellers/{id}/products")]
        public async Task<IActionResult> GetSellerProducts(int id, [FromQuery] ProductQuery query)
            => Ok(await _service.GetSellerProducts(id, query));

        // ── Sellers ───────────────────────────────────────────────────

        [HttpGet("sellers")]
        public async Task<IActionResult> GetSellers([FromQuery] SellerQueryDto query)
            => Ok(await _service.GetSellers(query));

        [HttpGet("sellers/{id}")]
        public async Task<IActionResult> GetSeller(int id)
            => Ok(await _service.GetSellerById(id));

        // ── Search ────────────────────────────────────────────────────

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
            => Ok(await _service.Search(query));

        // ── Reviews ───────────────────────────────────────────────────

        [Authorize]
        [HttpPost("products/{id}/review")]
        public async Task<IActionResult> AddReview(int id, CreateReviewDto dto)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null) return Unauthorized();
            return Ok(await _reviewService.AddReview(int.Parse(userIdClaim.Value), id, dto));
        }

        [HttpGet("products/{id}/reviews")]
        public async Task<IActionResult> GetReviews(int id)
            => Ok(await _reviewService.GetReviews(id));

        [Authorize]
        [HttpPost("sellers/{sellerId}/review")]
        public async Task<IActionResult> AddSellerReview(
            int sellerId,
            [FromBody] CreateSellerReviewDto dto,
            [FromServices] ISellerReviewService sellerReviewService)
        {
            var userIdClaim = User.FindFirst("userId");
            if (userIdClaim == null) return Unauthorized();
            return Ok(await sellerReviewService.AddSellerReview(
                int.Parse(userIdClaim.Value), sellerId, dto));
        }

        [HttpGet("sellers/{sellerId}/reviews")]
        public async Task<IActionResult> GetSellerReviews(
            int sellerId,
            [FromServices] ISellerReviewService sellerReviewService)
            => Ok(await sellerReviewService.GetSellerReviews(sellerId));

        
        [HttpGet("stores")]
        public async Task<IActionResult> GetStores([FromQuery] StoreQueryDto query)
            => Ok(await _service.GetStores(query));

       
        [HttpGet("stores/{sellerId}")]
        public async Task<IActionResult> GetStoreDetails(
            int sellerId, [FromQuery] ProductQuery productQuery)
            => Ok(await _service.GetStoreDetails(sellerId, productQuery));

[HttpGet("sentry-test")]

public IActionResult TestSentry()
{
    SentrySdk.CaptureMessage("Homiee backend test");

    throw new Exception("Sentry test exception");
}
        [HttpGet("nearby/stores")]
        public async Task<IActionResult> GetNearbyStores([FromQuery] NearbyQueryDto query)
            => Ok(await _service.GetNearbyStores(query));

        [HttpGet("nearby/products")]
        public async Task<IActionResult> GetNearbyProducts([FromQuery] NearbyQueryDto query)
            => Ok(await _service.GetNearbyProducts(query));

    //    [HttpGet("{productId:int}/recommendations")]
    //    [ProducesResponseType(typeof(IEnumerable<RecommendationResultDto>), StatusCodes.Status200OK)]
    //    [ProducesResponseType(StatusCodes.Status404NotFound)]
    //    public async Task<IActionResult> GetRecommendations(
    //int productId,
    //[FromQuery] int topN = 10,
    //CancellationToken cancellationToken = default)
    //    {
    //        try
    //        {
    //            var results = await _recommendationService.GetRecommendationsAsync(
    //                productId, topN, cancellationToken);
    //            return Ok(results);
    //        }
    //        catch (KeyNotFoundException ex)
    //        {
    //            return NotFound(new { message = ex.Message });
    //        }
        }
    }
