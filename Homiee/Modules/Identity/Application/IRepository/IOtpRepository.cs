using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Identity.Domain.Entities;

namespace Homiee.Modules.Identity.Application.IRepository
{
    public interface IOtpRepository
    {

        Task AddOtpAsync(OtpCode otpCode);
        Task<OtpCode?> GetValidOtpAsync(int userId, string otp);
        Task<List<OtpCode>> GetAllByUserIdAsync(int userId);
        void RemoveRange(List<OtpCode> otps);
        Task<OtpCode?> GetLatestOtpByUserId(int userId);
        Task SaveChangesAsync();

    };
}



