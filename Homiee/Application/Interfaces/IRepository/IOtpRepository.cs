using Homiee.Application.DTOs;
using Homiee.Domain.Entities;

namespace Homiee.Application.Interfaces.IRepository
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



