using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335;
using System.Runtime.InteropServices;

namespace Homiee.Modules.Identity.Infrastructure.Repositories
{
    public class TokenRepository : ITokenRepository
    {
        private readonly AppDbContext _context;

        public TokenRepository(AppDbContext context)
        {
            _context = context;
        }
        public async Task AddAsync(RefreshToken reToken)
        {
            await _context.RefreshTokens.AddAsync(reToken);
        }

        public async Task<RefreshToken?> GetByTokenAsync(string token)
        {
            return await _context.RefreshTokens
                .FirstOrDefaultAsync(x => x.Token == token);
        }
        public async Task<List<RefreshToken>> GetAllTokensByUserIdAsync(int userId)
        {
            return await _context.RefreshTokens
                .Where(x => x.UserId == userId)
                .ToListAsync();
        }
        public async Task<List<RefreshToken>> GetRefreshTokenByAsync(int userId)
        {
            return await _context.RefreshTokens
                .Where(x => x.UserId == userId && !x.IsRevoked)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();

        }

       
    }
}
