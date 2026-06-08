using Homiee.Modules.AiImage.Application.IRepository;
using Homiee.Modules.AiImage.Application.IServices;
using Homiee.Modules.AiImage.Application.Services;
using Homiee.Modules.AiImage.Domain.Enums;
using Homiee.Shared.Infrastructure.Storage;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace Homiee.Modules.AiImage.Infrastructure.Jobs
{
    /// <summary>
    /// Hangfire background job that:
    ///   1. Marks the request as Processing
    ///   2. Calls GeminiService to generate images
    ///   3. Uploads each image to Azure Blob Storage (same folder as manual uploads: "products")
    ///   4. Stores blob URLs in AiGenerationRequest
    ///   5. Marks the request as Completed or Failed
    ///
    /// Hangfire will auto-retry on exception up to MaxJobRetries times
    /// (configured via DisableConcurrentExecution and AutomaticRetry attributes).
    /// </summary>
    public class AiImageGenerationJob
    {
        private readonly IAiGenerationRepository _repo;
        private readonly IGeminiService _geminiService;
        private readonly AzureBlobByteUploader _blobUploader;
        private readonly ILogger<AiImageGenerationJob> _logger;

        public AiImageGenerationJob(
            IAiGenerationRepository repo,
            IGeminiService geminiService,
            AzureBlobByteUploader blobUploader,
            ILogger<AiImageGenerationJob> logger)
        {
            _repo = repo;
            _geminiService = geminiService;
            _blobUploader = blobUploader;
            _logger = logger;
        }

        /// <summary>Entry point called by Hangfire.</summary>
        public async Task ExecuteAsync(int requestId, CancellationToken cancellationToken = default)
        {
            _logger.LogInformation(
                "AiImageGenerationJob starting. RequestId={RequestId}", requestId);

            var request = await _repo.GetByIdAsync(requestId);

            if (request == null)
            {
                _logger.LogWarning(
                    "AiImageGenerationJob: RequestId={RequestId} not found. Skipping.", requestId);
                return;
            }

            // Guard against double-processing (if Hangfire retries a completed job)
            if (request.Status == GenerationStatus.Completed)
            {
                _logger.LogInformation(
                    "AiImageGenerationJob: RequestId={RequestId} already Completed. Skipping.", requestId);
                return;
            }

            if (request.Status == GenerationStatus.Cancelled)
            {
                _logger.LogInformation(
                    "AiImageGenerationJob: RequestId={RequestId} is Cancelled. Skipping.", requestId);
                return;
            }

            // Mark as Processing
            request.MarkProcessing();
            await _repo.SaveChangesAsync();

            try
            {
                // ── Step 1: Generate images via Gemini ───────────────────────
                _logger.LogInformation(
                    "Calling Gemini for RequestId={RequestId}, PromptHash={Hash}",
                    requestId, request.PromptHash);

                var imageBytesList = await _geminiService.GenerateImagesAsync(
                    request.OriginalPrompt,
                    cancellationToken);

                // ── Step 2: Upload each image to Azure Blob ──────────────────
                var blobUrls = new List<string>();

                foreach (var (imageBytes, index) in imageBytesList.Select((b, i) => (b, i)))
                {
                    _logger.LogInformation(
                        "Uploading image {Index}/{Total} for RequestId={RequestId}",
                        index + 1, imageBytesList.Count, requestId);

                    // Use SAME folder as manual product uploads — "products"
                    var url = await _blobUploader.UploadBytesAsync(
                        imageBytes,
                        folder: "products",
                        contentType: "image/png");

                    blobUrls.Add(url);
                }

                if (blobUrls.Count == 0)
                {
                    request.MarkFailed("No images were generated.");
                    await _repo.SaveChangesAsync();
                    return;
                }

                // ── Step 3: Persist results ──────────────────────────────────
                var urlsJson = JsonSerializer.Serialize(blobUrls);
                request.MarkCompleted(urlsJson);
                await _repo.SaveChangesAsync();

                _logger.LogInformation(
                    "AiImageGenerationJob completed. RequestId={RequestId}, Images={Count}",
                    requestId, blobUrls.Count);
            }
            catch (GeminiSafetyException ex)
            {
                // Safety filter — do NOT retry, mark as failed with user-facing message
                _logger.LogWarning(
                    "Gemini safety filter triggered for RequestId={RequestId}: {Message}",
                    requestId, ex.Message);

                request.MarkFailed(ex.Message);
                await _repo.SaveChangesAsync();
                // Do NOT rethrow — Hangfire should not retry safety failures
            }
            catch (GeminiException ex) when (ex.StatusCode is 429)
            {
                // Gemini quota exhausted — fail with friendly message, no retry
                _logger.LogError(
                    "Gemini rate limit or quota exceeded for RequestId={RequestId}: {Message}",
                    requestId, ex.Message);

                request.MarkFailed(GetGeminiLimitFailureMessage(ex.Message));
                await _repo.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "AiImageGenerationJob failed for RequestId={RequestId}. Retry may follow.",
                    requestId);

                request.IncrementRetry();
                request.MarkFailed($"Generation failed: {ex.Message}");
                await _repo.SaveChangesAsync();

                // Rethrow so Hangfire retry policy kicks in
                throw;
            }
        }

        private static string GetGeminiLimitFailureMessage(string geminiMessage)
        {
            if (geminiMessage.Contains("generate_content_free_tier", StringComparison.OrdinalIgnoreCase)
                || geminiMessage.Contains("limit: 0", StringComparison.OrdinalIgnoreCase))
            {
                return "Gemini image generation requires a paid Google AI billing plan for this project. Enable billing in AI Studio or use a paid API key, then retry.";
            }

            return $"AI generation limit reached: {geminiMessage}";
        }
    }

    // Import from GeminiService — kept here to avoid circular reference
    // (In production you'd put these in a shared Exceptions namespace)
}
