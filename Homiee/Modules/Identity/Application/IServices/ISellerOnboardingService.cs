using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Identity.Application.IServices
{
    public interface ISellerOnboardingService
    {
        Task<ApiResponse<string>> CompleteSellerDetails(int userId, CompleteSellerDetailsDto dto);
        Task<ApiResponse<string>> ResubmitSeller(int userId, CompleteSellerDetailsDto dto);
        Task<ApiResponse<object>> GetRejectionReason(int userId);
    }
}
