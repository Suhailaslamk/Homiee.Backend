using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
{
    public interface IChatRepository
    {
        Task AddAsync(ChatMessage message);
        Task<List<ChatMessage>> GetConversation(int user1, int user2);
        Task SaveChangesAsync();
    }
}
