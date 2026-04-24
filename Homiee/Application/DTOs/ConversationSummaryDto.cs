namespace Homiee.Application.DTOs
{
    public class ConversationSummaryDto
    {
        public int OtherUserId { get; set; }
        public string OtherUserName { get; set; } = null!;
        public string? OtherUserAvatar { get; set; }
        public string LastMessage { get; set; } = null!;
        public DateTime LastMessageAt { get; set; }
        public int UnreadCount { get; set; }
    }
}
