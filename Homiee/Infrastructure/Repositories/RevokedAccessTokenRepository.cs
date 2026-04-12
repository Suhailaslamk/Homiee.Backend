using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Repositories
{
    public class RevokedAccessTokenRepository : IRevokedAccessTokenRepository
    {
        private readonly AppDbContext _context;

        public RevokedAccessTokenRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(RevokedAccessToken token)
        {
            await _context.RevokedAccessTokens.AddAsync(token);
        }

        public async Task<bool> IsRevokedAsync(string token)
        {
            return await _context.RevokedAccessTokens
                .AnyAsync(t => t.Token == token && t.ExpiresAt > DateTime.UtcNow);
        }
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}