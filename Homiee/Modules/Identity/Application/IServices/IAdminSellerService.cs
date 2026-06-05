using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Identity.Application.IServices
{
    public interface IAdminSellerService
    {
        Task<PagedResult<SellerListDto>> GetSellers(SellerQueryParamsDto queryParams);
        Task<ApiResponse<object>> GetSellerDetails(int sellerId);
        Task<ApiResponse<string>> ApproveSeller(int sellerId);
        Task<ApiResponse<string>> RejectSeller(int userId, string reason);
        Task<ApiResponse<string>> SuspendSeller(int userId, string reason);
    }
}
