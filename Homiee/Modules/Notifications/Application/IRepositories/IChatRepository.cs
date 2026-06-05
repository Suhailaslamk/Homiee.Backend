using Homiee.Modules.Notifications.Application.Dtos;
using Homiee.Modules.Notifications.Domain.Entities;

namespace Homiee.Modules.Notifications.Application.IRepositories
{
    public interface IChatRepository
    {
        Task AddAsync(ChatMessage message);
        Task SaveChangesAsync();
        Task<List<ChatMessage>> GetConversation(int user1, int user2);
        Task<List<ConversationSummaryDto>> GetInboxAsync(int userId);
        Task MarkAsReadAsync(int senderId, int receiverId);
    }
}
