namespace Homiee.Modules.AiImage.Application.Options
{
    public class AiImageOptions
    {
        // Cache TTL for generated results in minutes
        public int GenerationCacheTtlMinutes { get; set; } = 60;

        // Per-user rate limit: max generations per window
        public int RateLimitMaxRequests { get; set; } = 5;

        // Window size in minutes for rate limit
        public int RateLimitWindowMinutes { get; set; } = 60;

        // Cooldown in seconds between requests for the same user
        public int CooldownSeconds { get; set; } = 10;

        // Max prompt length in characters
        public int MaxPromptLength { get; set; } = 500;

        // Min prompt length in characters
        public int MinPromptLength { get; set; } = 5;

        // Max Hangfire retries on transient failures
        public int MaxJobRetries { get; set; } = 2;

        // How long a generation result persists in DB before being considered stale (hours)
        public int ResultRetentionHours { get; set; } = 24;
    }
}