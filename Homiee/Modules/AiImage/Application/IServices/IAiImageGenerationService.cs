using Homiee.Modules.AiImage.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.AiImage.Application.IServices
{
    public interface IAiImageGenerationService
    {
        /// <summary>
        /// Validates the prompt, checks rate limit and cache,
        /// then enqueues a Hangfire job. Returns immediately.
        /// </summary>
        Task<ApiResponse<StartGenerationResponseDto>> StartGenerationAsync(StartGenerationDto dto, int userId);

        /// <summary>Polling endpoint — returns current status + image URLs if completed.</summary>
        Task<ApiResponse<GenerationStatusDto>> GetStatusAsync(int requestId, int userId);

        /// <summary>
        /// Called by the user after seeing generated images.
        /// The selected image URL is already a blob URL (uploaded during job completion).
        /// Optionally links to a product.
        /// </summary>
        Task<ApiResponse<SelectAiImageResponseDto>> SelectImageAsync(SelectAiImageDto dto, int userId);

        /// <summary>
        /// Re-queues a failed or completed job with the same prompt.
        /// Bypasses cache to force fresh generation.
        /// </summary>
        Task<ApiResponse<StartGenerationResponseDto>> RetryGenerationAsync(int requestId, int userId);
    }
}