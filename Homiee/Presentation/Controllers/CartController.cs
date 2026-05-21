using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/cart")]
    public class CartController : ControllerBase
    {
        private readonly ICartService _cartService;

        public CartController(ICartService cartService)
        {
            _cartService = cartService;
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

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetUserId();
            var result = await _cartService.GetCart(userId);
            return StatusCode(result.StatusCode, result);
        }

        [HttpPost("add")]
        public async Task<IActionResult> AddToCart(AddToCartDto dto)
        {
            var userId = GetUserId();
            var result = await _cartService.AddToCart(userId, dto);
            return StatusCode(result.StatusCode, result);
        }

        [HttpDelete("remove/{productId}")]
        public async Task<IActionResult> RemoveFromCart(int productId, [FromQuery] int? variantId = null)
        {
            var userId = GetUserId();
            var result = await _cartService.RemoveFromCart(userId, productId, variantId);
            return StatusCode(result.StatusCode, result);
        }
    }
}
