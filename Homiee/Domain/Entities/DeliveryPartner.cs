using Homiee.Domain.Enums;

namespace Homiee.Domain.Entities
{
    public class DeliveryPartner : BaseEntity
    {

        public int UserId { get; set; }
        public User User { get; set; } = null!;

        public string VehicleType { get; set; } = null!;
        public bool IsAvailable { get; set; } = true;
        public string? RejectionReason { get; set; }

        public ApprovalStatus Status { get; set; } = ApprovalStatus.Draft;

    }
}
