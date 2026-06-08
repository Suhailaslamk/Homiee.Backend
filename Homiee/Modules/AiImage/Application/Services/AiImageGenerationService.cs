using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Hangfire;
using Homiee.Modules.AiImage.Application.Dtos;
using Homiee.Modules.AiImage.Application.IRepository;
using Homiee.Modules.AiImage.Application.IServices;
using Homiee.Modules.AiImage.Application.Options;
using Homiee.Modules.AiImage.Application.Validators;
using Homiee.Modules.AiImage.Domain.Entities;
using Homiee.Modules.AiImage.Domain.Enums;
using Homiee.Modules.AiImage.Infrastructure.Jobs;
using Homiee.Shared.Common;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Homiee.Modules.AiImage.Application.Services
{
    public class AiImageGenerationService : IAiImageGenerationService
    {
        private readonly IAiGenerationRepository _repo;
        private readonly IAiImageRateLimitService _rateLimit;
        private readonly IBackgroundJobClient _jobClient;
        private readonly AiImageOptions _options;
        private readonly ILogger<AiImageGenerationService> _logger;

        public AiImageGenerationService(
            IAiGenerationRepository repo,
            IAiImageRateLimitService rateLimit,
            IBackgroundJobClient jobClient,
            IOptions<AiImageOptions> options,
            ILogger<AiImageGenerationService> logger)
        {
            _repo = repo;
            _rateLimit = rateLimit;
            _jobClient = jobClient;
            _options = options.Value;
            _logger = logger;
        }

        // ── StartGenerationAsync ─────────────────────────────────────────────
        public async Task<ApiResponse<StartGenerationResponseDto>> StartGenerationAsync(
            StartGenerationDto dto, int userId)
        {
            // 1. Validate prompt (layer-1 safety)
            var validation = PromptValidator.Validate(
                dto.Prompt,
                _options.MinPromptLength,
                _options.MaxPromptLength);

            if (!validation.IsValid)
                return new ApiResponse<StartGenerationResponseDto>(400, validation.ErrorMessage!);

            var sanitizedPrompt = validation.SanitizedPrompt;

            // 2. Cooldown check
            var cooldown = await _rateLimit.CheckCooldownAsync(userId);
            if (cooldown.IsOnCooldown)
                return new ApiResponse<StartGenerationResponseDto>(
                    429,
                    $"Please wait {cooldown.RemainingSeconds} seconds before generating again.");

            // 3. Rate limit check
            var rateLimitResult = await _rateLimit.CheckAndRecordAsync(userId);
            if (!rateLimitResult.IsAllowed)
                return new ApiResponse<StartGenerationResponseDto>(429, rateLimitResult.Message!);

            // 4. Normalize prompt + compute hash for dedup
            var normalizedPrompt = NormalizePrompt(sanitizedPrompt);
            var promptHash = ComputeHash(normalizedPrompt);

            // 5. Check for recent identical completed request (cache dedup)
            var notOlderThan = DateTime.UtcNow.AddMinutes(-_options.GenerationCacheTtlMinutes);
            var cached = await _repo.GetRecentCompletedByHashAsync(userId, promptHash, notOlderThan);

            if (cached != null)
            {
                _logger.LogInformation(
                    "Cache hit for UserId={UserId}, PromptHash={Hash}, RequestId={RequestId}",
                    userId, promptHash, cached.Id);

                return new ApiResponse<StartGenerationResponseDto>(200, "Images loaded from cache.",
                    new StartGenerationResponseDto
                    {
                        RequestId = cached.Id,
                        Status = cached.Status.ToString(),
                        CacheHit = true
                    });
            }

            // 6. Create new generation request
            var request = new AiGenerationRequest(userId, sanitizedPrompt, normalizedPrompt, promptHash);
            await _repo.AddAsync(request);
            await _repo.SaveChangesAsync();

            // 7. Enqueue Hangfire background job
            var jobId = _jobClient.Enqueue<AiImageGenerationJob>(
                job => job.ExecuteAsync(request.Id, CancellationToken.None));

            request.SetJobId(jobId);
            await _repo.SaveChangesAsync();

            // 8. Record cooldown
            await _rateLimit.RecordAttemptAsync(userId);

            _logger.LogInformation(
                "Generation queued. UserId={UserId}, RequestId={RequestId}, JobId={JobId}",
                userId, request.Id, jobId);

            return new ApiResponse<StartGenerationResponseDto>(202, "Generation started.",
                new StartGenerationResponseDto
                {
                    RequestId = request.Id,
                    Status = request.Status.ToString(),
                    CacheHit = false
                });
        }

        // ── GetStatusAsync ───────────────────────────────────────────────────
        public async Task<ApiResponse<GenerationStatusDto>> GetStatusAsync(int requestId, int userId)
        {
            var request = await _repo.GetByIdAndUserAsync(requestId, userId);

            if (request == null)
                return new ApiResponse<GenerationStatusDto>(404, "Generation request not found.");

            var imageUrls = new List<string>();

            if (request.Status == GenerationStatus.Completed
                && !string.IsNullOrEmpty(request.GeneratedImageUrlsJson))
            {
                try
                {
                    imageUrls = JsonSerializer.Deserialize<List<string>>(
                        request.GeneratedImageUrlsJson) ?? new();
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex,
                        "Failed to deserialize GeneratedImageUrlsJson for RequestId={RequestId}",
                        requestId);
                }
            }

            return new ApiResponse<GenerationStatusDto>(200, "Success",
                new GenerationStatusDto
                {
                    RequestId = request.Id,
                    Status = request.Status.ToString(),
                    ImageUrls = imageUrls,
                    FailureReason = request.FailureReason,
                    RetryCount = request.RetryCount
                });
        }

        // ── SelectImageAsync ─────────────────────────────────────────────────
        public async Task<ApiResponse<SelectAiImageResponseDto>> SelectImageAsync(
            SelectAiImageDto dto, int userId)
        {
            // Load entity with tracking for update
            var request = await _repo.GetByIdAsync(dto.RequestId);

            if (request == null || request.UserId != userId || request.IsDeleted)
                return new ApiResponse<SelectAiImageResponseDto>(404, "Generation request not found.");

            if (request.Status != GenerationStatus.Completed)
                return new ApiResponse<SelectAiImageResponseDto>(400,
                    "Cannot select an image before generation is complete.");

            // Validate the selected URL is actually one of the generated ones
            if (string.IsNullOrEmpty(request.GeneratedImageUrlsJson))
                return new ApiResponse<SelectAiImageResponseDto>(400, "No generated images found.");

            var generatedUrls = JsonSerializer.Deserialize<List<string>>(
                request.GeneratedImageUrlsJson) ?? new();

            if (!generatedUrls.Contains(dto.SelectedImageUrl))
                return new ApiResponse<SelectAiImageResponseDto>(400,
                    "Selected image URL does not match any generated image.");

            // Record the selection
            request.RecordSelectedImage(dto.SelectedImageUrl, dto.ProductId);
            await _repo.SaveChangesAsync();

            _logger.LogInformation(
                "User {UserId} selected AI image for RequestId={RequestId}, ProductId={ProductId}",
                userId, dto.RequestId, dto.ProductId);

            return new ApiResponse<SelectAiImageResponseDto>(200, "Image selected successfully.",
                new SelectAiImageResponseDto
                {
                    // The URL is already a blob URL — return as-is for the frontend
                    BlobUrl = dto.SelectedImageUrl
                });
        }

        // ── RetryGenerationAsync ─────────────────────────────────────────────
        public async Task<ApiResponse<StartGenerationResponseDto>> RetryGenerationAsync(
            int requestId, int userId)
        {
            var original = await _repo.GetByIdAndUserAsync(requestId, userId);

            if (original == null)
                return new ApiResponse<StartGenerationResponseDto>(404,
                    "Generation request not found.");

            if (original.Status == GenerationStatus.Pending ||
                original.Status == GenerationStatus.Processing)
                return new ApiResponse<StartGenerationResponseDto>(400,
                    "Generation is still in progress.");

            // Cooldown check
            var cooldown = await _rateLimit.CheckCooldownAsync(userId);
            if (cooldown.IsOnCooldown)
                return new ApiResponse<StartGenerationResponseDto>(
                    429,
                    $"Please wait {cooldown.RemainingSeconds} seconds before retrying.");

            // Rate limit check (bypass cache for explicit retry)
            var rateLimitResult = await _rateLimit.CheckAndRecordAsync(userId);
            if (!rateLimitResult.IsAllowed)
                return new ApiResponse<StartGenerationResponseDto>(429, rateLimitResult.Message!);

            // Create a new request with same prompt — bypasses cache
            var newRequest = new AiGenerationRequest(
                userId,
                original.OriginalPrompt,
                original.NormalizedPrompt,
                original.PromptHash);

            await _repo.AddAsync(newRequest);
            await _repo.SaveChangesAsync();

            var jobId = _jobClient.Enqueue<AiImageGenerationJob>(
                job => job.ExecuteAsync(newRequest.Id, CancellationToken.None));

            newRequest.SetJobId(jobId);
            await _repo.SaveChangesAsync();

            await _rateLimit.RecordAttemptAsync(userId);

            _logger.LogInformation(
                "Retry queued. UserId={UserId}, OriginalRequestId={Original}, NewRequestId={New}",
                userId, requestId, newRequest.Id);

            return new ApiResponse<StartGenerationResponseDto>(202, "Retry started.",
                new StartGenerationResponseDto
                {
                    RequestId = newRequest.Id,
                    Status = newRequest.Status.ToString(),
                    CacheHit = false
                });
        }

        // ── Helpers ──────────────────────────────────────────────────────────
        private static string NormalizePrompt(string prompt)
        {
            // Trim, collapse whitespace, lowercase — for consistent hash
            var sb = new StringBuilder();
            var prevWasSpace = false;
            foreach (var c in prompt.ToLowerInvariant())
            {
                if (char.IsWhiteSpace(c))
                {
                    if (!prevWasSpace) sb.Append(' ');
                    prevWasSpace = true;
                }
                else
                {
                    sb.Append(c);
                    prevWasSpace = false;
                }
            }
            return sb.ToString().Trim();
        }

        private static string ComputeHash(string input)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(input));
            return Convert.ToHexString(bytes)[..16]; // First 16 hex chars — sufficient for dedup
        }
    }
}