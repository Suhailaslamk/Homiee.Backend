using Homiee.Modules.Cart.Application.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Modules.Cart.Api.Controllers
{
    [ApiController]
    [Route("api/wishlist")]
    [Authorize(Roles = "User")]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _service;

        public WishlistController(IWishlistService service)
        {
            _service = service;
        }

        private int GetUserId()
        {
            var claim = User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(claim) || !int.TryParse(claim, out var userId))
                throw new UnauthorizedAccessException("Invalid token");

            return userId;
        }

        [HttpPost("{productId}")]
        public async Task<IActionResult> Add(int productId)
        {
            var result = await _service.AddToWishlist(GetUserId(), productId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpDelete("{productId}")]
        public async Task<IActionResult> Remove(int productId)
        {
            var result = await _service.RemoveFromWishlist(GetUserId(), productId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyWishlist()
        {
            var result = await _service.GetMyWishlist(GetUserId());
            return StatusCode(result.StatusCode, result);
        }
        [HttpDelete("clear")]
        public async Task<IActionResult> ClearWishlist()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;

            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            var result = await _service.ClearWishlist(userId);

            return StatusCode(result.StatusCode, result);
        }
    }
}