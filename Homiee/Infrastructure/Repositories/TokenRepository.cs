using Homiee.Application.Interfaces.IRepository;
using Homiee.Domain.Entities;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Reflection.Metadata.Ecma335;
using System.Runtime.InteropServices;

namespace Homiee.Infrastructure.Repositories
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
