namespace Homiee.Domain.Entities
{
    public class ChatMessage : BaseEntity
    {

        public int SenderId { get; set; }
        public int ReceiverId { get; set; }

        public string Message { get; set; } = null!;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;

        public bool IsRead { get; set; } = false;
    }
}
