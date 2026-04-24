using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
{
    public class ChatRepository : IChatRepository
    {
        private readonly AppDbContext _context;

        public ChatRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(ChatMessage message)
        {
            await _context.ChatMessages.AddAsync(message);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }

        public async Task<List<ChatMessage>> GetConversation(int user1, int user2)
        {
            return await _context.ChatMessages
                .Where(m =>
                    (m.SenderId == user1 && m.ReceiverId == user2) ||
                    (m.SenderId == user2 && m.ReceiverId == user1))
                .OrderBy(m => m.SentAt)
                .ToListAsync();
        }

        public async Task<List<ConversationSummaryDto>> GetInboxAsync(int userId)
        {
            return await _context.ChatMessages
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .GroupBy(m => m.SenderId == userId ? m.ReceiverId : m.SenderId)
                .Select(g => new ConversationSummaryDto
                {
                    OtherUserId = g.Key,
                    OtherUserName = _context.Users
                        .Where(u => u.Id == g.Key)
                        .Select(u => u.Name)
                        .FirstOrDefault() ?? "Unknown",
                    OtherUserAvatar = _context.Users
                        .Where(u => u.Id == g.Key)
                        .Select(u => u.ProfilePictureUrl)
                        .FirstOrDefault(),
                    LastMessage = g.OrderByDescending(m => m.SentAt)
                        .Select(m => m.Message)
                        .FirstOrDefault() ?? "",
                    LastMessageAt = g.Max(m => m.SentAt),
                    UnreadCount = g.Count(m => m.ReceiverId == userId && !m.IsRead)
                })
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync();
        }

        public async Task MarkAsReadAsync(int senderId, int receiverId)
        {
            var unread = await _context.ChatMessages
                .Where(m => m.SenderId == senderId && m.ReceiverId == receiverId && !m.IsRead)
                .ToListAsync();

            unread.ForEach(m => m.IsRead = true);
            await _context.SaveChangesAsync();
        }
    }
}