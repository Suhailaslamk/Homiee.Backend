using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.Options;
using Homiee.Common;
using Homiee.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Homiee.Application.Services
{
    public class MarketplaceQueryService : IMarketplaceQueryService
    {
        private readonly ICategoryRepository _categoryRepo;
        private readonly IProductRepository _productRepo;
        private readonly ISellersRepository _sellerRepo;
        private readonly ICacheService _cache;
        private readonly CacheSettings _cfg;

        public MarketplaceQueryService(
            ICategoryRepository categoryRepo,
            IProductRepository productRepo,
            ISellersRepository sellerRepo,
            ICacheService cache,
            IOptions<CacheSettings> cfg)
        {
            _categoryRepo = categoryRepo;
            _productRepo = productRepo;
            _sellerRepo = sellerRepo;
            _cache = cache;
            _cfg = cfg.Value; 
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 1. CATEGORIES
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<List<CategoryDto>>> GetCategories()
        {
            const string key = "marketplace:categories";
            var cached = await _cache.GetAsync<List<CategoryDto>>(key);
            if (cached is not null)
                return new ApiResponse<List<CategoryDto>>(200, "Success", cached);

            var categories = await _categoryRepo.Query()
                .Where(c => c.IsActive)
                .Select(c => new CategoryDto { Id = c.Id, Name = c.Name })
                .ToListAsync();

            await _cache.SetAsync(key, categories,
                TimeSpan.FromMinutes(_cfg.CategoryTtlMinutes));

            return new ApiResponse<List<CategoryDto>>(200, "Success", categories);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 2. PRODUCTS — global search with InStock + MinRating + full SortBy
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<PagedResult<ProductListDto>>> GetProducts(ProductQuery request)
        {
            var query = _productRepo.Query()
                .Where(p => !p.IsDeleted)
                .Include(p => p.Images)
                .Include(p => p.Seller).ThenInclude(s => s.User)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(request.Search))
            {
                var s = request.Search.ToLower();
                query = query.Where(p =>
                    p.Name.ToLower().Contains(s) ||
                    (p.Description != null && p.Description.ToLower().Contains(s)));
            }

            if (request.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == request.CategoryId);

            if (request.MinPrice.HasValue)
                query = query.Where(p => p.Price >= request.MinPrice.Value);
            if (request.MaxPrice.HasValue)
                query = query.Where(p => p.Price <= request.MaxPrice.Value);

            if (request.MinRating.HasValue)
                query = query.Where(p => p.AverageRating >= request.MinRating.Value);

            if (request.InStockOnly == true)
                query = query.Where(p => p.Stock > 0);

            var total = await query.CountAsync();

            if (request.Page <= 0) request.Page = 1;
            if (request.PageSize <= 0) request.PageSize = 10;
            if (request.PageSize > 50) request.PageSize = 50;

            query = request.SortBy?.ToLower() switch
            {
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "rating" => query.OrderByDescending(p => p.AverageRating),
                "popular" => query.OrderByDescending(p => p.ReviewCount),
                "newest" => query.OrderByDescending(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => new ProductListDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    IsAvailable = p.Stock > 0,
                    Stock = p.Stock,
                    AverageRating = p.AverageRating,
                    ReviewCount = p.ReviewCount,
                    SellerId = p.SellerId,
                    SellerUserId = p.Seller != null ? p.Seller.UserId : 0,
                    BusinessName = p.Seller != null ? p.Seller.BusinessName : null,
                    SellerName = p.Seller != null && p.Seller.User != null
                                       ? p.Seller.User.Name : null,
                    ImageUrl = p.Images.FirstOrDefault() != null ? p.Images.FirstOrDefault().ImageUrl : null,
                    CategoryId = p.CategoryId
                })
                .ToListAsync();

            return new ApiResponse<PagedResult<ProductListDto>>(200, "Success",
                new PagedResult<ProductListDto>(200, "Success", items, total,
                    request.Page, request.PageSize));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 3. PRODUCT DETAILS
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<SellerProductDetailsDto>> GetProductById(int id)
        {
            var key = $"product:detail:{id}";
            var cached = await _cache.GetAsync<SellerProductDetailsDto>(key);
            if (cached is not null)
                return new ApiResponse<SellerProductDetailsDto>(200, "Success", cached);

            var product = await _productRepo.Query()
                .AsNoTracking()
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

            if (product == null)
                return new ApiResponse<SellerProductDetailsDto>(404, "Product not found");

            var dto = new SellerProductDetailsDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                CategoryId = product.CategoryId,
                Images = product.Images?.Select(i => i.ImageUrl).ToList() ?? new List<string>()
            };

            await _cache.SetAsync(key, dto,
                TimeSpan.FromMinutes(_cfg.ProductDetailTtlMinutes));

            return new ApiResponse<SellerProductDetailsDto>(200, "Success", dto);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 4. SELLER DETAILS
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<SellerDetailsDto>> GetSellerById(int sellerId)
        {
            var key = $"seller:detail:{sellerId}";
            var cached = await _cache.GetAsync<SellerDetailsDto>(key);
            if (cached is not null)
                return new ApiResponse<SellerDetailsDto>(200, "Success", cached);

            var seller = await _sellerRepo.Query()
                .Include(s => s.User)
                .FirstOrDefaultAsync(s => s.Id == sellerId);

            if (seller == null)
                return new ApiResponse<SellerDetailsDto>(404, "Seller not found");

            var dto = new SellerDetailsDto
            {
                Id = seller.Id,
                BusinessName = seller.BusinessName ?? "",
                PhoneNumber = seller.PhoneNumber ?? "",
                Address = seller.Address ?? ""
            };

            await _cache.SetAsync(key, dto,
                TimeSpan.FromMinutes(_cfg.SellerDetailTtlMinutes));

            return new ApiResponse<SellerDetailsDto>(200, "Success", dto);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 5. SELLERS LIST
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<PagedResult<SellerListDto>>> GetSellers(SellerQueryDto request)
        {
            var query = _sellerRepo.Query()
                .Where(s => s.Status == ApprovalStatus.Approved)
                .Include(s => s.User)
                .Include(s => s.Products)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(request.Search))
                query = query.Where(s =>
                    EF.Functions.Like(s.BusinessName, $"%{request.Search}%"));

            if (request.CategoryId.HasValue)
                query = query.Where(s =>
                    s.Products.Any(p => p.CategoryId == request.CategoryId && !p.IsDeleted));

            var total = await query.CountAsync();
            if (request.Page <= 0) request.Page = 1;
            if (request.PageSize <= 0) request.PageSize = 10;
            if (request.PageSize > 50) request.PageSize = 50;

            var items = await query
                .OrderByDescending(s => s.AverageRating)
                .ThenByDescending(s => s.Id)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(s => new SellerListDto
                {
                    Id = s.Id,
                    BusinessName = s.BusinessName,
                    Address = s.Address,
                    PhoneNumber = s.PhoneNumber,
                    ProductCount = s.Products.Count(p => !p.IsDeleted)
                })
                .ToListAsync();

            return new ApiResponse<PagedResult<SellerListDto>>(200, "Success",
                new PagedResult<SellerListDto>(200, "Success", items, total,
                    request.Page, request.PageSize));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 6. SELLER PRODUCTS
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<PagedResult<ProductListDto>>> GetSellerProducts(
            int sellerId, ProductQuery request)
        {
            var sellerExists = await _sellerRepo.Query().AnyAsync(s => s.Id == sellerId);
            if (!sellerExists)
                return new ApiResponse<PagedResult<ProductListDto>>(404, "Seller not found");

            var query = _productRepo.Query()
                .Where(p => p.SellerId == sellerId && !p.IsDeleted)
                .Include(p => p.Images)
                .Include(p => p.Seller).ThenInclude(s => s.User)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(request.Search))
                query = query.Where(p => EF.Functions.Like(p.Name, $"%{request.Search}%"));

            if (request.MinPrice.HasValue)
                query = query.Where(p => p.Price >= request.MinPrice);

            if (request.MaxPrice.HasValue)
                query = query.Where(p => p.Price <= request.MaxPrice);

            if (request.InStockOnly == true)
                query = query.Where(p => p.Stock > 0);

            if (request.MinRating.HasValue)
                query = query.Where(p => p.AverageRating >= request.MinRating);

            var total = await query.CountAsync();
            if (request.Page <= 0) request.Page = 1;
            if (request.PageSize <= 0) request.PageSize = 10;
            if (request.PageSize > 50) request.PageSize = 50;

            query = request.SortBy?.ToLower() switch
            {
                "price_asc" => query.OrderBy(p => p.Price),
                "price_desc" => query.OrderByDescending(p => p.Price),
                "rating" => query.OrderByDescending(p => p.AverageRating),
                "popular" => query.OrderByDescending(p => p.ReviewCount),
                "newest" => query.OrderByDescending(p => p.CreatedAt),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => new ProductListDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    Stock = p.Stock,
                    IsAvailable = p.Stock > 0,
                    AverageRating = p.AverageRating,
                    ReviewCount = p.ReviewCount,
                    SellerId = p.SellerId,
                    SellerUserId = p.Seller != null ? p.Seller.UserId : 0,
                    BusinessName = p.Seller != null ? p.Seller.BusinessName : null,
                    SellerName = p.Seller != null && p.Seller.User != null
                                       ? p.Seller.User.Name : null,
                    ImageUrl = p.Images.FirstOrDefault() != null ? p.Images.FirstOrDefault().ImageUrl : null,
                    CategoryId = p.CategoryId
                })
                .ToListAsync();

            return new ApiResponse<PagedResult<ProductListDto>>(200, "Success",
                new PagedResult<ProductListDto>(200, "Success", items, total,
                    request.Page, request.PageSize));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 7. SEARCH
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<SearchResultDto>> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new ApiResponse<SearchResultDto>(400, "Query is required");

            var products = await _productRepo.Query()
                .Where(p => !p.IsDeleted && EF.Functions.Like(p.Name, $"%{query}%"))
                .Include(p => p.Images)
                .Include(p => p.Seller).ThenInclude(s => s.User)
                .Take(10)
                .Select(p => new ProductListDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    SellerId = p.SellerId,
                    SellerUserId = p.Seller != null ? p.Seller.UserId : 0,
                    AverageRating = p.AverageRating,
                    SellerName = p.Seller != null && p.Seller.User != null
                                     ? p.Seller.User.Name : null,
                    ImageUrl = p.Images.FirstOrDefault() != null ? p.Images.FirstOrDefault().ImageUrl : null,
                    CategoryId = p.CategoryId
                })
                .ToListAsync();

            var sellers = await _sellerRepo.Query()
                .Where(s => EF.Functions.Like(s.BusinessName, $"%{query}%"))
                .Include(s => s.Products)
                .Take(10)
                .Select(s => new SellerListDto
                {
                    Id = s.Id,
                    BusinessName = s.BusinessName,
                    ProductCount = s.Products.Count(p => !p.IsDeleted)
                })
                .ToListAsync();

            return new ApiResponse<SearchResultDto>(200, "Success",
                new SearchResultDto { Products = products, Sellers = sellers });
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 8. STORES — paginated list with MinRating filter
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<PagedResult<SellerStoreDto>>> GetStores(StoreQueryDto request)
        {
            var query = _sellerRepo.Query()
                .Where(s => s.Status == ApprovalStatus.Approved)
                .Include(s => s.Products)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(request.Search))
                query = query.Where(s =>
                    EF.Functions.Like(s.BusinessName, $"%{request.Search}%"));

            if (request.CategoryId.HasValue)
                query = query.Where(s =>
                    s.Products.Any(p => p.CategoryId == request.CategoryId && !p.IsDeleted));

            if (request.MinRating.HasValue)
                query = query.Where(s => s.AverageRating >= request.MinRating);

            var total = await query.CountAsync();
            if (request.Page <= 0) request.Page = 1;
            if (request.PageSize <= 0) request.PageSize = 10;
            if (request.PageSize > 50) request.PageSize = 50;

            query = request.SortBy?.ToLower() switch
            {
                "popular" => query.OrderByDescending(s => s.ReviewCount),
                "newest" => query.OrderByDescending(s => s.Id),
                _ => query.OrderByDescending(s => s.AverageRating)
                                  .ThenByDescending(s => s.Id)
            };

            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(s => new SellerStoreDto
                {
                    SellerId = s.Id,
                    SellerUserId = s.UserId,
                    BusinessName = s.BusinessName,
                    Address = s.Address,
                    PhoneNumber = s.PhoneNumber,
                    AverageRating = s.AverageRating,
                    ReviewCount = s.ReviewCount,
                    ProductCount = s.Products.Count(p => !p.IsDeleted),
                    Latitude = s.Latitude,
                    Longitude = s.Longitude
                })
                .ToListAsync();

            return new ApiResponse<PagedResult<SellerStoreDto>>(200, "Success",
                new PagedResult<SellerStoreDto>(200, "Success", items, total,
                    request.Page, request.PageSize));
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 9. STORE DETAILS PAGE
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<SellerStorePageDto>> GetStoreDetails(
            int sellerId, ProductQuery productQuery)
        {
            var seller = await _sellerRepo.Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == sellerId &&
                                          s.Status == ApprovalStatus.Approved);

            if (seller == null)
                return new ApiResponse<SellerStorePageDto>(404, "Store not found");

            var productsResponse = await GetSellerProducts(sellerId, productQuery);

            var dto = new SellerStorePageDto
            {
                SellerId = seller.Id,
                SellerUserId = seller.UserId,
                BusinessName = seller.BusinessName,
                Address = seller.Address,
                PhoneNumber = seller.PhoneNumber,
                AverageRating = seller.AverageRating,
                ReviewCount = seller.ReviewCount,
                Latitude = seller.Latitude,
                Longitude = seller.Longitude,
                Products = productsResponse.Data!
            };

            return new ApiResponse<SellerStorePageDto>(200, "Success", dto);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 10. NEARBY STORES — bounding-box SQL pre-filter + Haversine in-memory
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<List<SellerStoreDto>>> GetNearbyStores(NearbyQueryDto request)
        {
            var (minLat, maxLat, minLon, maxLon) =
                GeoHelper.BoundingBox(request.Latitude, request.Longitude, request.RadiusKm);

            var candidates = await _sellerRepo.Query()
                .Where(s => s.Status == ApprovalStatus.Approved
                         && s.Latitude >= minLat && s.Latitude <= maxLat
                         && s.Longitude >= minLon && s.Longitude <= maxLon)
                .Include(s => s.Products)
                .AsNoTracking()
                .Select(s => new SellerStoreDto
                {
                    SellerId = s.Id,
                    SellerUserId = s.UserId,
                    BusinessName = s.BusinessName,
                    Address = s.Address,
                    PhoneNumber = s.PhoneNumber,
                    AverageRating = s.AverageRating,
                    ReviewCount = s.ReviewCount,
                    ProductCount = s.Products.Count(p => !p.IsDeleted),
                    Latitude = s.Latitude,
                    Longitude = s.Longitude
                })
                .ToListAsync();

            // Exact Haversine filter + distance annotation (in-memory)
            var results = candidates
                .Select(s =>
                {
                    s.DistanceKm = Math.Round(
                        GeoHelper.DistanceKm(request.Latitude, request.Longitude,
                                             s.Latitude, s.Longitude), 2);
                    return s;
                })
                .Where(s => s.DistanceKm <= request.RadiusKm)
                .OrderBy(s => s.DistanceKm)
                .ToList();

            return new ApiResponse<List<SellerStoreDto>>(200, "Success", results);
        }

        // ─────────────────────────────────────────────────────────────────────────
        // 11. NEARBY PRODUCTS — bounding-box SQL pre-filter + Haversine in-memory
        //     SortBy: distance (default), rating, price_asc, price_desc, newest, popular
        // ─────────────────────────────────────────────────────────────────────────

        public async Task<ApiResponse<PagedResult<ProductListDto>>> GetNearbyProducts(
            NearbyQueryDto request)
        {
            var (minLat, maxLat, minLon, maxLon) =
                GeoHelper.BoundingBox(request.Latitude, request.Longitude, request.RadiusKm);

            var dbQuery = _productRepo.Query()
                .Where(p => !p.IsDeleted
                         && p.Seller.Latitude >= minLat && p.Seller.Latitude <= maxLat
                         && p.Seller.Longitude >= minLon && p.Seller.Longitude <= maxLon)
                .Include(p => p.Images)
                .Include(p => p.Seller).ThenInclude(s => s.User)
                .AsNoTracking();

            if (request.CategoryId.HasValue)
                dbQuery = dbQuery.Where(p => p.CategoryId == request.CategoryId);

            if (request.MinPrice.HasValue)
                dbQuery = dbQuery.Where(p => p.Price >= request.MinPrice);

            if (request.MaxPrice.HasValue)
                dbQuery = dbQuery.Where(p => p.Price <= request.MaxPrice);

            if (request.InStockOnly == true)
                dbQuery = dbQuery.Where(p => p.Stock > 0);

            if (request.MinRating.HasValue)
                dbQuery = dbQuery.Where(p => p.AverageRating >= request.MinRating);

            var allCandidates = await dbQuery
                .Select(p => new
                {
                    Dto = new ProductListDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Description = p.Description,
                        Price = p.Price,
                        Stock = p.Stock,
                        IsAvailable = p.Stock > 0,
                        AverageRating = p.AverageRating,
                        ReviewCount = p.ReviewCount,
                        CategoryId = p.CategoryId,
                        SellerId = p.SellerId,
                        SellerUserId = p.Seller != null ? p.Seller.UserId : 0,
                        BusinessName = p.Seller != null ? p.Seller.BusinessName : null,
                        SellerName = p.Seller != null && p.Seller.User != null
                                           ? p.Seller.User.Name : null,
                        ImageUrl = p.Images.FirstOrDefault() != null ? p.Images.FirstOrDefault().ImageUrl : null,
                    },
                    SellerLat = p.Seller.Latitude,
                    SellerLon = p.Seller.Longitude,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            var filtered = allCandidates
                .Select(x =>
                {
                    x.Dto.DistanceKm = Math.Round(
                        GeoHelper.DistanceKm(request.Latitude, request.Longitude,
                                             x.SellerLat, x.SellerLon), 2);
                    return x;
                })
                .Where(x => x.Dto.DistanceKm <= request.RadiusKm)
                .ToList();

            var total = filtered.Count;

            if (request.Page <= 0) request.Page = 1;
            if (request.PageSize <= 0) request.PageSize = 10;
            if (request.PageSize > 50) request.PageSize = 50;

            IEnumerable<ProductListDto> sorted = request.SortBy?.ToLower() switch
            {
                "price_asc" => filtered.OrderBy(x => x.Dto.Price).Select(x => x.Dto),
                "price_desc" => filtered.OrderByDescending(x => x.Dto.Price).Select(x => x.Dto),
                "rating" => filtered.OrderByDescending(x => x.Dto.AverageRating).Select(x => x.Dto),
                "popular" => filtered.OrderByDescending(x => x.Dto.ReviewCount).Select(x => x.Dto),
                "newest" => filtered.OrderByDescending(x => x.CreatedAt).Select(x => x.Dto),
                _ => filtered.OrderBy(x => x.Dto.DistanceKm).Select(x => x.Dto)
            };

            var items = sorted
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .ToList();

            return new ApiResponse<PagedResult<ProductListDto>>(200, "Success",
                new PagedResult<ProductListDto>(200, "Success", items, total,
                    request.Page, request.PageSize));
        }
    }
}