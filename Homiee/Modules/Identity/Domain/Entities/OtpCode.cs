using Homiee.Shared.Domain.Entities;

namespace Homiee.Modules.Identity.Domain.Entities
{
    public class OtpCode : BaseEntity
    {
        public int UserId { get; set; }

        public string Code { get; set; }

        public DateTime ExpiresAt { get; set;  }

        public bool IsUsed { get; set;  }
        public int AttemptCount { get; set; } = 0;
        public int MaxAttempts { get; set; } = 5;

        public DateTime? LastOtpSentAt { get; set; }

        public User User { get; set; }

    }
}
