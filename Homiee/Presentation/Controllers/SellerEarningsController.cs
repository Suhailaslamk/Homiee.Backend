
    using global::Homiee.Application.Interfaces.IServices;
    using Homiee.Application.Interfaces.IServices;
    using Microsoft.AspNetCore.Authorization;
    using Microsoft.AspNetCore.Mvc;

    namespace Homiee.Presentation.Controllers
    {
        [Route("api/seller/earnings")]
        [ApiController]
        [Authorize(Roles = "Seller")]
        public class SellerEarningsController : ControllerBase
        {
            private readonly ISellerEarningService _earningService;

            public SellerEarningsController(ISellerEarningService earningService)
            {
                _earningService = earningService;
            }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("Invalid or missing token");

            if (!int.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("Invalid userId claim");

            return userId;
        }

        /// <summary>
        /// GET /api/seller/earnings
        /// Returns dashboard summary (total, pending, available, paid) + paginated history.
        /// </summary>
        [HttpGet]
            public async Task<IActionResult> GetEarnings(
                [FromQuery] int page = 1,
                [FromQuery] int pageSize = 20)
            {
                var result = await _earningService.GetEarnings(GetUserId(), page, pageSize);
                return StatusCode(result.StatusCode, result);
            }
        }
    }
