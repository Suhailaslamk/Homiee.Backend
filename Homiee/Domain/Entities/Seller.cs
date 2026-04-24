using Homiee.Domain.Enums;

namespace Homiee.Domain.Entities
{
    public class Seller : BaseEntity
    {
        public int UserId { get; set; }
        public User User { get; set; } = null!;
        public string BusinessName { get; set; } = null!;
        public string Address { get; set; } = null!;
        public string? PhoneNumber { get; set; }
        public string? GSTNumber { get; set; }
        public string? BusinessProofUrl { get; set; }
        public string? IdentityProofUrl { get; set; }
        public ICollection<Product> Products { get; set; }
        public ApprovalStatus Status { get; set; } = ApprovalStatus.Draft;
        public string? RejectionReason { get; set; }
        public DateTime? ReviewedAt { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double AverageRating { get; set; } = 0;
        public int ReviewCount { get; set; } = 0;

        public void Approve()
        {
            if (Status == ApprovalStatus.Approved)
                throw new InvalidOperationException("Seller already approved");
            Status = ApprovalStatus.Approved;
            RejectionReason = null;
            ReviewedAt = DateTime.UtcNow;
        }

        public void Reject(string reason)
        {
            if (Status == ApprovalStatus.Approved)
                throw new InvalidOperationException("Approved seller cannot be rejected");
            if (string.IsNullOrWhiteSpace(reason))
                throw new ArgumentException("Rejection reason is required");
            Status = ApprovalStatus.Rejected;
            RejectionReason = reason;
            ReviewedAt = DateTime.UtcNow;
        }

        public void Suspend(string reason)
        {
            if (Status != ApprovalStatus.Approved)
                throw new InvalidOperationException("Only approved sellers can be suspended");
            Status = ApprovalStatus.Suspended;
            RejectionReason = reason;
            ReviewedAt = DateTime.UtcNow;
        }

        public void UpdateRating(double newAverage, int newCount)
        {
            AverageRating = Math.Round(newAverage, 2);
            ReviewCount = newCount;
        }
    }
}