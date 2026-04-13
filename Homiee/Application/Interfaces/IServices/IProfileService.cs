using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Common;
using Homiee.Domain.Enums;
using System.Text.RegularExpressions;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IProfileService
    {


        Task<ApiResponse<UserProfileDto>> GetProfile(int userId);
            
        Task<ApiResponse<string>> UpdateProfile(int userId, UpdateProfileDto dto, UserRole requesterRole);
}
}