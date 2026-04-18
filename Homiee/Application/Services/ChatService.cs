using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Entities;

namespace Homiee.Application.Services
{
    public class ChatService : IChatService
    {
        private readonly IChatRepository _repo;

        public ChatService(IChatRepository repo)
        {
            _repo = repo;
        }

        public async Task SendMessage(int senderId, int receiverId, string message)
        {
            var msg = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message
            };

            await _repo.AddAsync(msg);
            await _repo.SaveChangesAsync();
        }

        public async Task<List<ChatMessage>> GetConversation(int userId, int otherUserId)
        {
            return await _repo.GetConversation(userId, otherUserId);
        }
    }
}
