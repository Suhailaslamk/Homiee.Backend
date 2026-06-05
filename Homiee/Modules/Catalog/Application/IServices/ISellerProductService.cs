using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Shared.Common;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Modules.Catalog.Application.IServices
{
    public interface ISellerProductService
    {
        Task<ApiResponse<string>> CreateProduct(CreateProductDto dto, int userId);
        Task<ApiResponse<string>> UpdateProduct(int productId, UpdateProductDto dto, int userId);
        Task<ApiResponse<string>> DeleteProduct(int productId, int userId);
        Task<ApiResponse<string>> UpdateStock(int productId, UpdateStockDto dto, int userId);
        Task<ApiResponse<PagedResult<ProductDto>>> GetProducts(int userId, ProductQuery query);
        Task<ApiResponse<string>> DeleteImage(int imageId, int userId);
        Task<ApiResponse<string>> AddImages(int productId, int userId, List<IFormFile> files);
        Task<ApiResponse<string>> SetPrimaryImage(int imageId, int userId);
        Task<ApiResponse<SellerProductDetailsDto>> GetProductById(int productId, int userId);
        Task<ApiResponse<List<CategoryDto>>> GetCategories();
    }
}
