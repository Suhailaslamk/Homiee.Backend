using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IAdminSellerService
    {
        Task<PagedResult<SellerListDto>> GetSellers(SellerQueryParamsDto queryParams);
        Task<ApiResponse<object>> GetSellerDetails(int userId);
        Task<ApiResponse<string>> ApproveSeller(int userId);
        Task<ApiResponse<string>> RejectSeller(int userId, string reason);
    }
}
