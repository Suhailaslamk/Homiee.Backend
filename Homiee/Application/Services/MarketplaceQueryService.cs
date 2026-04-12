using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Application.Services
{
        public class MarketplaceQueryService : IMarketplaceQueryService
        {
            private readonly ICategoryRepository _categoryRepo;
            private readonly IProductRepository _productRepo;
            private readonly ISellersRepository _sellerRepo;

            public MarketplaceQueryService(
                ICategoryRepository categoryRepo,
                IProductRepository productRepo,
                ISellersRepository sellerRepo)
            {
                _categoryRepo = categoryRepo;
                _productRepo = productRepo;
                _sellerRepo = sellerRepo;
            }

            // ✅ 1. Categories
            public async Task<ApiResponse<List<CategoryDto>>> GetCategories()
            {
                var categories = await _categoryRepo.Query()
                    .Where(c => c.IsActive)
                    .Select(c => new CategoryDto
                    {
                        Id = c.Id,
                        Name = c.Name
                    })
                    .ToListAsync();

                return new ApiResponse<List<CategoryDto>>(200, "Success", categories);
            }

            // ✅ 2. Products (GLOBAL SEARCH)
            public async Task<ApiResponse<PagedResult<ProductListDto>>> GetProducts(ProductQuery request)
            {
                var query = _productRepo.Query()
                    .Where(p => !p.IsDeleted)
                    .Include(p => p.Images)
                    .Include(p => p.Seller)
                        .ThenInclude(s => s.User)
                    .AsNoTracking();

                // Filters
                if (request.CategoryId.HasValue)
                    query = query.Where(p => p.CategoryId == request.CategoryId);

                if (!string.IsNullOrEmpty(request.Search))
                {
                    var search = request.Search.ToLower();
                    query = query.Where(p =>
                        EF.Functions.Like(p.Name, $"%{search}%"));
                }

                if (request.MinPrice.HasValue)
                    query = query.Where(p => p.Price >= request.MinPrice);

                if (request.MaxPrice.HasValue)
                    query = query.Where(p => p.Price <= request.MaxPrice);

                var total = await query.CountAsync();

                var items = await query
                    .OrderByDescending(p => p.CreatedAt)
                    .Skip((request.Page - 1) * request.PageSize)
                    .Take(request.PageSize)
                    .Select(p => new ProductListDto
                    {
                        Id = p.Id,
                        Name = p.Name,
                        Price = p.Price,
                        SellerId = p.SellerId,
                        SellerName = p.Seller.User.Name,
                        ImageUrl = p.Images
                            .Where(i => i.IsPrimary)
                            .Select(i => i.ImageUrl)
                            .FirstOrDefault()
                    })
                    .ToListAsync();

                var result = new PagedResult<ProductListDto>(
                    200, "Success", items, total, request.Page, request.PageSize);

                return new ApiResponse<PagedResult<ProductListDto>>(200, "Success", result);
            }

            // ✅ 3. Product Details
            public async Task<ApiResponse<SellerProductDetailsDto>> GetProductById(int id)
            {
                                 var product = await _productRepo.Query()
                     .AsNoTracking()
                     .Include(p => p.Images) // 🔥 REQUIRED
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

                Images = product.Images
    .Select(i => i.ImageUrl)
    .ToList()
            };

            return new ApiResponse<SellerProductDetailsDto>(200, "Success", dto);
            }

            // ✅ 4. Seller Details
            public async Task<ApiResponse<SellerDetailsDto>> GetSellerById(int sellerId)
            {
                var seller = await _sellerRepo.Query()
                    .Include(s => s.User)
                    .FirstOrDefaultAsync(s => s.Id == sellerId);

                if (seller == null)
                    return new ApiResponse<SellerDetailsDto>(404, "Seller not found");

                var dto = new SellerDetailsDto
                {
                    Id = seller.Id,
                    BusinessName = seller.BusinessName,
                    PhoneNumber = seller.PhoneNumber,
                    Address = seller.Address
                };

                return new ApiResponse<SellerDetailsDto>(200, "Success", dto);
            }

        public async Task<ApiResponse<PagedResult<SellerListDto>>> GetSellers(SellerQueryDto request)
        {
            var query = _sellerRepo.Query()
                   .Include(s => s.User)
                   .Include(s => s.Products)
                   .AsNoTracking();
                   
            // 🔍 Search by business name
            if (!string.IsNullOrEmpty(request.Search))
            {
                var search = request.Search.ToLower();
                query = query.Where(s => EF.Functions.Like(s.BusinessName, $"%{search}%"));
            }

            // 📂 Filter by category (IMPORTANT: via products)
            if (request.CategoryId.HasValue)
            {
                query = query.Where(s =>
                    s.Products.Any(p => p.CategoryId == request.CategoryId && !p.IsDeleted));
            }

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(s => s.Id)
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

            var result = new PagedResult<SellerListDto>(
                200, "Success", items, total, request.Page, request.PageSize);

            return new ApiResponse<PagedResult<SellerListDto>>(200, "Success", result);
        }
        public async Task<ApiResponse<PagedResult<ProductListDto>>> GetSellerProducts(int sellerId, ProductQuery request)
        {
            var sellerExists = await _sellerRepo.Query().AnyAsync(s => s.Id == sellerId);
            if (!sellerExists)
                return new ApiResponse<PagedResult<ProductListDto>>(404, "Seller not found");

            var query = _productRepo.Query()
                .Where(p => p.SellerId == sellerId && !p.IsDeleted)
                .Include(p => p.Images)
                .Include(p => p.Seller)
                    .ThenInclude(s => s.User)
                .AsNoTracking();

            if (!string.IsNullOrEmpty(request.Search))
            {
                var search = request.Search.ToLower();
                query = query.Where(p => EF.Functions.Like(p.Name, $"%{search}%"));
            }

            if (request.MinPrice.HasValue)
                query = query.Where(p => p.Price >= request.MinPrice);

            if (request.MaxPrice.HasValue)
                query = query.Where(p => p.Price <= request.MaxPrice);

            var total = await query.CountAsync();

            var items = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => new ProductListDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    SellerId = p.SellerId,
                    SellerName = p.Seller.User.Name,
                    ImageUrl = p.Images
                        .Where(i => i.IsPrimary)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                })
                .ToListAsync();

            var result = new PagedResult<ProductListDto>(
                200, "Success", items, total, request.Page, request.PageSize);

            return new ApiResponse<PagedResult<ProductListDto>>(200, "Success", result);
        }
        public async Task<ApiResponse<SearchResultDto>> Search(string query)
        {
            if (string.IsNullOrWhiteSpace(query))
                return new ApiResponse<SearchResultDto>(400, "Query is required");

            var search = query.ToLower();

            // 🔍 Products
            var products = await _productRepo.Query()
                .Where(p => !p.IsDeleted && EF.Functions.Like(p.Name, $"%{search}%"))
                .Include(p => p.Images)
                .Include(p => p.Seller)
                    .ThenInclude(s => s.User)
                .Take(10)
                .Select(p => new ProductListDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    SellerId = p.SellerId,
                    SellerName = p.Seller.User.Name,
                    ImageUrl = p.Images
                        .Where(i => i.IsPrimary)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                })
                .ToListAsync();

            // 🏪 Sellers
            var sellers = await _sellerRepo.Query()
                .Where(s => EF.Functions.Like(s.BusinessName, $"%{search}%"))
                .Include(s => s.Products)
                .Take(10)
                .Select(s => new SellerListDto
                {
                    Id = s.Id,
                    BusinessName = s.BusinessName,
                    ProductCount = s.Products.Count(p => !p.IsDeleted)
                })
                .ToListAsync();

            var result = new SearchResultDto
            {
                Products = products,
                Sellers = sellers
            };

            return new ApiResponse<SearchResultDto>(200, "Success", result);
        }
    }
    }

