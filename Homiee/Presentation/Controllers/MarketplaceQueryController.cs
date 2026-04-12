using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [ApiController]
    [Route("api/marketplace")]
    public class MarketplaceController : ControllerBase
    {
        private readonly IMarketplaceQueryService _service;
        private readonly IReviewService _reviewService;

        public MarketplaceController(IMarketplaceQueryService service, IReviewService reviewService)
        {
            _service = service;
            _reviewService = reviewService;
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

        [HttpGet("sellers/{id}")]
        public async Task<IActionResult> GetSeller(int id)
            => Ok(await _service.GetSellerById(id));
        [HttpGet("sellers")]
        public async Task<IActionResult> GetSellers([FromQuery] SellerQueryDto query)
        => Ok(await _service.GetSellers(query));

        [HttpGet("sellers/{id}/products")]
        public async Task<IActionResult> GetSellerProducts(int id, [FromQuery] ProductQuery query)
            => Ok(await _service.GetSellerProducts(id, query));

        [HttpGet("search")]
        public async Task<IActionResult> Search([FromQuery] string query)
            => Ok(await _service.Search(query));
        [Authorize]
        [HttpPost("products/{id}/review")]
        public async Task<IActionResult> AddReview(int id, CreateReviewDto dto)
        {
            var userId = int.Parse(User.FindFirst("userId")!.Value);
            return Ok(await _reviewService.AddReview(userId, id, dto));
        }

        [HttpGet("products/{id}/reviews")]
        public async Task<IActionResult> GetReviews(int id)
        {
            return Ok(await _reviewService.GetReviews(id));
        }
    }
}
