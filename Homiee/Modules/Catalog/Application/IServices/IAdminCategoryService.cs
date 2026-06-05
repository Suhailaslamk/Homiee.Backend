using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Shared.Common;

namespace Homiee.Modules.Catalog.Application.IServices
{
    public interface IAdminCategoryService
    {
        Task<ApiResponse<string>> Create(CreateCategoryDto dto);
        Task<ApiResponse<string>> Update(int id, UpdateCategoryDto dto);
        Task<ApiResponse<string>> Toggle(int id);
        Task<ApiResponse<List<CategoryDto>>> GetAll();
    }
}
