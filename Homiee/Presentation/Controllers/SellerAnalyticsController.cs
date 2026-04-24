using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [ApiController]
    [Route("api/seller/analytics")]
    [Authorize(Roles = "Seller")]
    public class SellerAnalyticsController : ControllerBase
    {
        private readonly ISellerAnalyticsService _service;
        private readonly ISellersRepository _sellerRepo;

        public SellerAnalyticsController(
            ISellerAnalyticsService service,
            ISellersRepository sellerRepo)
        {
            _service = service;
            _sellerRepo = sellerRepo;
        }

        [HttpGet]
        public async Task<IActionResult> GetAnalytics([FromQuery] SellerAnalyticsQueryDto query)
        {
            var sellerId = await ResolveSellerId();
            if (sellerId == 0) return Unauthorized();

            var result = await _service.GetAnalytics(sellerId, query);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet("kpis")]
        public async Task<IActionResult> GetKpis()
        {
            var sellerId = await ResolveSellerId();
            if (sellerId == 0) return Unauthorized();

            var result = await _service.GetKpis(sellerId);
            return StatusCode(result.StatusCode, result);
        }

        // Reads userId from JWT → looks up Sellers.Id (the real sellerId)
        private async Task<int> ResolveSellerId()
        {
            var claim = User.FindFirst("userId")?.Value;
            if (!int.TryParse(claim, out var userId)) return 0;

            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            return seller?.Id ?? 0;
        }
    }
}