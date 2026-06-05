using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Shared.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
namespace Homiee.Modules.Identity.Infrastructure.Repositories
{
    public class OtpRepository : IOtpRepository
    {
        private readonly AppDbContext _context;
        public  OtpRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddOtpAsync(OtpCode otpCode)
        {
            await _context.OtpCodes.AddAsync(otpCode);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
        public async Task<OtpCode?> GetValidOtpAsync(int userId, string otp)
        {
            return await _context.OtpCodes.FirstOrDefaultAsync(x =>
                x.UserId == userId &&
                x.Code == otp &&
                !x.IsUsed &&
                x.ExpiresAt > DateTime.UtcNow);
        }

        public async Task<List<OtpCode>> GetAllByUserIdAsync(int userId)
        {
            return await _context.OtpCodes
                .Where(x => x.UserId == userId)
                .ToListAsync();
        }
        

        public async Task<OtpCode?> GetLatestOtpByUserId(int userId)
        {
            return await _context.OtpCodes
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.ExpiresAt)
                .FirstOrDefaultAsync();
        }
        

        public void RemoveRange(List<OtpCode> otps)
        {
            _context.OtpCodes.RemoveRange(otps);
        }
    };
}
