using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IChatService
    {
        Task SendMessage(int senderId, int receiverId, string message);
        Task<List<ChatMessage>> GetConversation(int userId, int otherUserId);
    }
}
