using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Catalog.Application.IServices
{
    public interface IAdminProductService
    {
        Task<ApiResponse<PagedResult<AdminProductDto>>> GetAll(AdminProductQueryDto query);
        Task<ApiResponse<AdminProductDetailsDto>> GetById(int id);

        //Task<ApiResponse<string>> Approve(int id);
        //Task<ApiResponse<string>> Reject(int id, string reason);

        Task<ApiResponse<string>> Delete(int id);
    }
}
