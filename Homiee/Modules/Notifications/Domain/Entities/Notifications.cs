using Homiee.Shared.Domain.Entities;

namespace Homiee.Modules.Notifications.Domain.Entities
{
    public class Notification : BaseEntity
    {
        public int UserId { get; set; }

        public string Title { get; set; } = null!;
        public string Message { get; set; } = null!;

        public bool IsRead { get; set; } = false;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
