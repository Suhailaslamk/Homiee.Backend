using Homiee.Modules.Notifications.Application.Dtos;

namespace Homiee.Modules.Notifications.Application.IServices
{
    public interface IChatService
    {
        Task<ChatMessageDto> SendMessageAsync(int senderId, int receiverId, string message);
        Task<List<ChatMessageDto>> GetConversationAsync(int userId, int otherUserId);
        Task<List<ConversationSummaryDto>> GetInboxAsync(int userId);
        Task MarkAsReadAsync(int senderId, int receiverId);
    }
}
