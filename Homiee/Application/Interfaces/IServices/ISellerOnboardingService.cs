using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface ISellerOnboardingService
    {
        Task<ApiResponse<string>> CompleteSellerDetails(int userId, CompleteSellerDetailsDto dto);
        Task<ApiResponse<string>> ResubmitSeller(int userId, CompleteSellerDetailsDto dto);
    }
}
