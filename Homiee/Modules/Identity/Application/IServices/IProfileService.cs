using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Shared.Common;
using System.Text.RegularExpressions;

namespace Homiee.Modules.Identity.Application.IServices
{
    public interface IProfileService
    {


        Task<ApiResponse<UserProfileDto>> GetProfile(int userId);





             Task<ApiResponse<string>> UpdateUserProfile(int userId,UpdateUserprofileDto dto);


            Task<ApiResponse<string>> UpdateSellerProfile(
                int userId,
                UpdateSellerProfileDto dto);


}
}