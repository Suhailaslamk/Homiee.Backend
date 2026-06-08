using Homiee.Modules.AiImage.Application.Dtos;
using Homiee.Modules.AiImage.Application.IServices;
using Homiee.Shared.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Modules.AiImage.Api.Controllers
{
    /// <summary>
    /// AI Image Generation endpoints.
    /// All endpoints require Seller role (same as product creation).
    ///
    /// POST   /api/seller/ai-images/generate         → start generation
    /// GET    /api/seller/ai-images/{requestId}/status → poll status
    /// POST   /api/seller/ai-images/select            → select an image
    /// POST   /api/seller/ai-images/{requestId}/retry → retry failed job
    /// </summary>
    [Route("api/seller/ai-images")]
    [ApiController]
    [Authorize(Roles = "Seller")]
    public class AiImageController : ControllerBase
    {
        private readonly IAiImageGenerationService _service;

        public AiImageController(IAiImageGenerationService service)
        {
            _service = service;
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
        /// Validates prompt, checks rate limit and cache, then enqueues a background job.
        /// Returns 202 Accepted with requestId for polling.
        /// Returns 200 OK with requestId if result was cached.
        /// </summary>
        [HttpPost("generate")]
        public async Task<IActionResult> StartGeneration([FromBody] StartGenerationDto dto)
        {
            var result = await _service.StartGenerationAsync(dto, GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Poll endpoint. Frontend polls this every 2s until Status is Completed or Failed.
        /// Returns status + image URLs when Completed.
        /// </summary>
        [HttpGet("{requestId:int}/status")]
        public async Task<IActionResult> GetStatus(int requestId)
        {
            var result = await _service.GetStatusAsync(requestId, GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// User selects one of the generated images.
        /// Records the selection; returns the blob URL for use in product creation.
        /// The blob URL behaves identically to a manually-uploaded image URL.
        /// </summary>
        [HttpPost("select")]
        public async Task<IActionResult> SelectImage([FromBody] SelectAiImageDto dto)
        {
            var result = await _service.SelectImageAsync(dto, GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        /// <summary>
        /// Retry a failed or completed generation with the same prompt.
        /// Bypasses cache to force fresh generation.
        /// Subject to the same rate limits as a new generation.
        /// </summary>
        [HttpPost("{requestId:int}/retry")]
        public async Task<IActionResult> Retry(int requestId)
        {
            var result = await _service.RetryGenerationAsync(requestId, GetUserId());
            return StatusCode(result.StatusCode, result);
        }
    }
}