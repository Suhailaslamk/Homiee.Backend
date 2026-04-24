using Homiee.Application.DTOs;
using Homiee.Common;

namespace Homiee.Application.Interfaces.IServices
{
    public interface IMarketplaceQueryService
    {
        Task<ApiResponse<List<CategoryDto>>> GetCategories();
        Task<ApiResponse<PagedResult<ProductListDto>>> GetProducts(ProductQuery query);
        Task<ApiResponse<SellerProductDetailsDto>> GetProductById(int id);
        Task<ApiResponse<SellerDetailsDto>> GetSellerById(int sellerId);
        Task<ApiResponse<PagedResult<SellerListDto>>> GetSellers(SellerQueryDto query);
        Task<ApiResponse<PagedResult<ProductListDto>>> GetSellerProducts(int sellerId, ProductQuery query);
        Task<ApiResponse<SearchResultDto>> Search(string query);

        Task<ApiResponse<PagedResult<SellerStoreDto>>> GetStores(StoreQueryDto query);
        Task<ApiResponse<SellerStorePageDto>> GetStoreDetails(int sellerId, ProductQuery productQuery);

        Task<ApiResponse<List<SellerStoreDto>>> GetNearbyStores(NearbyQueryDto query);
        Task<ApiResponse<PagedResult<ProductListDto>>> GetNearbyProducts(NearbyQueryDto query);


        // ── Step 7: Location-based ────────────────────────────────────













    }
}
