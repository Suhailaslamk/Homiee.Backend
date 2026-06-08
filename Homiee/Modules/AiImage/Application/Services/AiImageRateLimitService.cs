using Homiee.Modules.AiImage.Application.IServices;
using Homiee.Modules.AiImage.Application.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using StackExchange.Redis;

namespace Homiee.Modules.AiImage.Application.Services
{
    /// <summary>
    /// Redis-backed rate limiter for AI image generation.
    ///
    /// Two mechanisms:
    ///   1. Sliding window counter  — max N requests per M minutes per user
    ///   2. Per-request cooldown    — user must wait X seconds between requests
    ///
    /// Redis keys:
    ///   ai:ratelimit:{userId}  → sorted set of epoch-ms timestamps
    ///   ai:cooldown:{userId}   → string with expiry = cooldown seconds
    /// </summary>
    public class AiImageRateLimitService : IAiImageRateLimitService
    {
        private readonly IConnectionMultiplexer _redis;
        private readonly AiImageOptions _options;
        private readonly ILogger<AiImageRateLimitService> _logger;

        public AiImageRateLimitService(
            IConnectionMultiplexer redis,
            IOptions<AiImageOptions> options,
            ILogger<AiImageRateLimitService> logger)
        {
            _redis = redis;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<RateLimitResult> CheckAndRecordAsync(int userId)
        {
            var db = _redis.GetDatabase();
            var key = $"ai:ratelimit:{userId}";
            var now = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            var windowMs = _options.RateLimitWindowMinutes * 60 * 1000L;
            var windowStart = now - windowMs;

            // Atomic: remove expired entries + count + add current if within limit
            // Uses a sorted set where score = epoch-ms
            var tran = db.CreateTransaction();

            // Remove entries outside the window
            _ = tran.SortedSetRemoveRangeByScoreAsync(key, double.NegativeInfinity, windowStart);

            // Count entries within window
            var countTask = tran.SortedSetLengthAsync(key, windowStart, now);

            await tran.ExecuteAsync();

            var count = (int)await countTask;

            if (count >= _options.RateLimitMaxRequests)
            {
                _logger.LogWarning(
                    "Rate limit hit for UserId={UserId}. Count={Count}, Max={Max}",
                    userId, count, _options.RateLimitMaxRequests);

                return new RateLimitResult
                {
                    IsAllowed = false,
                    RemainingRequests = 0,
                    WindowMinutes = _options.RateLimitWindowMinutes,
                    Message = $"You have reached the limit of {_options.RateLimitMaxRequests} AI image " +
                              $"generations per {_options.RateLimitWindowMinutes} minutes. Please try again later."
                };
            }

            // Record this request
            await db.SortedSetAddAsync(key, now.ToString(), now);
            await db.KeyExpireAsync(key, TimeSpan.FromMinutes(_options.RateLimitWindowMinutes + 1));

            return new RateLimitResult
            {
                IsAllowed = true,
                RemainingRequests = _options.RateLimitMaxRequests - count - 1,
                WindowMinutes = _options.RateLimitWindowMinutes
            };
        }

        public async Task<CooldownResult> CheckCooldownAsync(int userId)
        {
            var db = _redis.GetDatabase();
            var key = $"ai:cooldown:{userId}";

            var ttl = await db.KeyTimeToLiveAsync(key);

            if (ttl.HasValue && ttl.Value > TimeSpan.Zero)
            {
                return new CooldownResult
                {
                    IsOnCooldown = true,
                    RemainingSeconds = (int)Math.Ceiling(ttl.Value.TotalSeconds)
                };
            }

            return new CooldownResult { IsOnCooldown = false };
        }

        public async Task RecordAttemptAsync(int userId)
        {
            var db = _redis.GetDatabase();
            var key = $"ai:cooldown:{userId}";
            await db.StringSetAsync(key, "1", TimeSpan.FromSeconds(_options.CooldownSeconds));
        }
    }
}