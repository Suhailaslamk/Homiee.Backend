using Homiee.Application.DTOs;
using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
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
