using Homiee.Modules.AiImage.Domain.Enums;
using Homiee.Shared.Domain.Entities;

namespace Homiee.Modules.AiImage.Domain.Entities
{
    /// <summary>
    /// Tracks a single AI image generation request.
    /// Stored in DB so the frontend can poll status and retrieve results.
    /// GeneratedImageUrls stores blob URLs of generated images (comma-separated or JSON array).
    /// SelectedImageUrl is populated when the user selects one image for a product.
    /// </summary>
    public class AiGenerationRequest : BaseEntity
    {
        public int UserId { get; private set; }

        // Normalized (trimmed, lower-cased, whitespace-collapsed) prompt for cache keying
        public string NormalizedPrompt { get; private set; } = string.Empty;

        // Original prompt as entered by the user, for display purposes
        public string OriginalPrompt { get; private set; } = string.Empty;

        // SHA-256 hash of NormalizedPrompt — used as cache key suffix
        public string PromptHash { get; private set; } = string.Empty;

        public GenerationStatus Status { get; private set; } = GenerationStatus.Pending;

        // JSON array of blob URLs: ["https://...1.png","https://...2.png"]
        public string? GeneratedImageUrlsJson { get; private set; }

        // Blob URL of the image the user chose and uploaded to a product
        public string? SelectedImageUrl { get; private set; }

        // Hangfire background job ID — allows cancellation if needed
        public string? HangfireJobId { get; private set; }

        // Human-readable failure reason
        public string? FailureReason { get; private set; }

        // Retry count (Hangfire retry increments this)
        public int RetryCount { get; private set; } = 0;

        // Optional: link to the product this was used for
        public int? ProductId { get; private set; }

        private AiGenerationRequest() { }

        public AiGenerationRequest(int userId, string originalPrompt, string normalizedPrompt, string promptHash)
        {
            UserId = userId;
            OriginalPrompt = originalPrompt;
            NormalizedPrompt = normalizedPrompt;
            PromptHash = promptHash;
            Status = GenerationStatus.Pending;
        }

        public void SetJobId(string jobId)
        {
            HangfireJobId = jobId;
        }

        public void MarkProcessing()
        {
            Status = GenerationStatus.Processing;
        }

        public void MarkCompleted(string imageUrlsJson)
        {
            Status = GenerationStatus.Completed;
            GeneratedImageUrlsJson = imageUrlsJson;
            FailureReason = null;
        }

        public void MarkFailed(string reason)
        {
            Status = GenerationStatus.Failed;
            FailureReason = reason;
        }

        public void MarkCancelled()
        {
            Status = GenerationStatus.Cancelled;
        }

        public void IncrementRetry()
        {
            RetryCount++;
        }

        public void RecordSelectedImage(string imageUrl, int? productId = null)
        {
            SelectedImageUrl = imageUrl;
            ProductId = productId;
        }
    }
}