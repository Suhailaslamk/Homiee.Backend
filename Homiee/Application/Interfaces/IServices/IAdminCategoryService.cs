using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IAdminCategoryService
    {
        Task<ApiResponse<string>> Create(CreateCategoryDto dto);
        Task<ApiResponse<string>> Update(int id, UpdateCategoryDto dto);
        Task<ApiResponse<string>> Toggle(int id);
        Task<ApiResponse<List<CategoryDto>>> GetAll();
    }
}
