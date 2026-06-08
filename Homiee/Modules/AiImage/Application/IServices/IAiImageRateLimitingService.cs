namespace Homiee.Modules.AiImage.Application.IServices
{
    public interface IAiImageRateLimitService
    {
        /// <summary>
        /// Returns true if the user is allowed to make a new generation request.
        /// Records the attempt if allowed.
        /// </summary>
        Task<RateLimitResult> CheckAndRecordAsync(int userId);

        /// <summary>Checks cooldown — true if user must wait.</summary>
        Task<CooldownResult> CheckCooldownAsync(int userId);

        /// <summary>Records a new request attempt timestamp for cooldown tracking.</summary>
        Task RecordAttemptAsync(int userId);
    }

    public class RateLimitResult
    {
        public bool IsAllowed { get; init; }
        public int RemainingRequests { get; init; }
        public int WindowMinutes { get; init; }
        public string? Message { get; init; }
    }

    public class CooldownResult
    {
        public bool IsOnCooldown { get; init; }
        public int RemainingSeconds { get; init; }
    }
}