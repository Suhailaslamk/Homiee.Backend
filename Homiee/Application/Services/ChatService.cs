using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Application.Services
{
    public class ChatService : IChatService
    {
        private readonly IChatRepository _repo;
        private readonly AppDbContext _context;

        public ChatService(IChatRepository repo, AppDbContext context)
        {
            _repo = repo;
            _context = context;
        }

        public async Task<ChatMessageDto> SendMessageAsync(int senderId, int receiverId, string message)
        {
            var msg = new ChatMessage
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Message = message
            };

            await _repo.AddAsync(msg);
            await _repo.SaveChangesAsync();

            var senderName = await _context.Users
                .Where(u => u.Id == senderId)
                .Select(u => u.Name)
                .FirstOrDefaultAsync() ?? senderId.ToString();

            return new ChatMessageDto
            {
                Id = msg.Id,
                SenderId = msg.SenderId,
                SenderName = senderName,
                ReceiverId = msg.ReceiverId,
                Message = msg.Message,
                SentAt = msg.SentAt,
                IsRead = msg.IsRead
            };
        }

        public async Task<List<ChatMessageDto>> GetConversationAsync(int userId, int otherUserId)
        {
            var messages = await _repo.GetConversation(userId, otherUserId);

            // Resolve both names in one query
            var ids = new[] { userId, otherUserId };
            var names = await _context.Users
                .Where(u => ids.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.Name);

            return messages.Select(m => new ChatMessageDto
            {
                Id = m.Id,
                SenderId = m.SenderId,
                SenderName = names.GetValueOrDefault(m.SenderId, m.SenderId.ToString()),
                ReceiverId = m.ReceiverId,
                Message = m.Message,
                SentAt = m.SentAt,
                IsRead = m.IsRead
            }).ToList();
        }

        public async Task<List<ConversationSummaryDto>> GetInboxAsync(int userId)
        {
            return await _repo.GetInboxAsync(userId);
        }

        public async Task MarkAsReadAsync(int senderId, int receiverId)
        {
            await _repo.MarkAsReadAsync(senderId, receiverId);
        }
    }
}