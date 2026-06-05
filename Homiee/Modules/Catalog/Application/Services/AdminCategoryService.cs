using Microsoft.EntityFrameworkCore;
using Homiee.Modules.Catalog.Domain.Entities;
using Homiee.Shared.Common;
using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Modules.Catalog.Application.IServices;
using Homiee.Modules.Catalog.Application.IRepository;

namespace Homiee.Modules.Catalog.Application.Services
{
    public class AdminCategoryService :  IAdminCategoryService
    {
        private readonly ICategoryRepository _repo;

        public AdminCategoryService(ICategoryRepository repo)
        {
            _repo = repo;
        }

        public async Task<ApiResponse<string>> Create(CreateCategoryDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Name))
                return new ApiResponse<string>(400, "Name is required");

            var existing = await _repo.GetByNameAsync(dto.Name);

            if (existing != null)
                return new ApiResponse<string>(409, "Category already exists");

            try
            {
                var category = new Category(dto.Name);

                await _repo.AddAsync(category);
                await _repo.SaveChangesAsync();

                return new ApiResponse<string>(200, "Category created");
            }
            catch
            {
                return new ApiResponse<string>(500, "Something went wrong");
            }
        }

        public async Task<ApiResponse<string>> Update(int id, UpdateCategoryDto dto)
        {
            var category = await _repo.GetByIdAsync(id);

            if (category == null)
                return new ApiResponse<string>(404, "Category not found");

            try
            {
                category.SetName(dto.Name);

                await _repo.SaveChangesAsync();

                return new ApiResponse<string>(200, "Updated successfully");
            }
            catch
            {
                return new ApiResponse<string>(400, "Invalid data");
            }
        }

        public async Task<ApiResponse<string>> Toggle(int id)
        {
            var category = await _repo.GetByIdAsync(id);

            if (category == null)
                return new ApiResponse<string>(404, "Category not found");

            if (category.IsActive)
                category.Disable();
            else
                category.Enable();

            await _repo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Status updated");
        }

        public async Task<ApiResponse<List<CategoryDto>>> GetAll()
        {
            var categories = await _repo.Query()
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    IsActive = c.IsActive
                })
                .ToListAsync();

            return new ApiResponse<List<CategoryDto>>(200, "Success", categories);
        }
    }
}
