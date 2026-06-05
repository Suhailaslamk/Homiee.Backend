using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Homiee.Modules.Catalog.Domain.Entities;
using Homiee.Shared.Common;
using Homiee.Shared.Domain.Enums;
using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Modules.Catalog.Application.IServices;
using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Modules.Catalog.Application.IRepository;
using Homiee.Shared.Applications.IServices;
using Homiee.Shared.Applications.IData;
using Homiee.Shared.Applications.Options;

namespace Homiee.Modules.Catalog.Application.Services
{
    public class SellerProductService : ISellerProductService
    {
        private readonly IProductRepository _productRepo;
        private readonly ISellersRepository _sellerRepo;
        private readonly IProductImageRepository _productImageRepo;
        private readonly IFileStorageService _fileService;
        private readonly ICategoryRepository _categoryRepo;
        private readonly ICacheService _cache;
        private readonly CacheSettings _cfg;
        private readonly IApplicationDbContext _dbContext;

        public SellerProductService(IProductRepository productRepo,
                                   ISellersRepository sellerRepo,
                                   IProductImageRepository productImageRepo,
                                   IFileStorageService fileService,
                                   ICategoryRepository categoryRepo,
                                   ICacheService cache,
                                   IOptions<CacheSettings> cfg,
                                   IApplicationDbContext dbContext)
        {
            _productRepo = productRepo;
            _sellerRepo = sellerRepo;
            _productImageRepo = productImageRepo;
            _fileService = fileService;
            _categoryRepo = categoryRepo;
            _cache = cache;
            _cfg = cfg.Value;
            _dbContext = dbContext;
        }

        public async Task<ApiResponse<string>> CreateProduct(CreateProductDto dto, int userId)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (dto == null)
                return new ApiResponse<string>(400, "Invalid request");
            

           

            if (dto.Image.Length > 5 * 1024 * 1024)
                return new ApiResponse<string>(400, "File too large");
            if (dto.Image == null || dto.Image.Length == 0)
                return new ApiResponse<string>(400, "Image is required");
            if (dto.CategoryId <= 0)
                return new ApiResponse<string>(400, "Category is required");
            if (!dto.Image.ContentType.StartsWith("image/"))
                return new ApiResponse<string>(400, "Invalid file type");
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            if (string.IsNullOrWhiteSpace(dto.Name))
                return new ApiResponse<string>(400, "Product name is required");

            if (dto.Name.Length > 150)
                return new ApiResponse<string>(400, "Product name too long");
            if (seller.Status != ApprovalStatus.Approved)
                return new ApiResponse<string>(403, "Seller not approved");
            var category = await _categoryRepo.GetByIdAsync(dto.CategoryId);

            if (category == null)
                return new ApiResponse<string>(400, "Category does not exist");
            if (dto.Price <= 0)
                return new ApiResponse<string>(400, "Price must be greater than zero");
            if (dto.Stock <= 0)
                return new ApiResponse<string>(400, "Stock must be greater than zero");
            if (!category.IsActive)
                return new ApiResponse<string>(400, "Category is inactive");

            if (dto.Stock < 0)
                return new ApiResponse<string>(400, "Stock cannot be negative");
            try
            {
                var imageUrl = await _fileService.UploadAsync(dto.Image, "products");
                //var product = new Product(seller.Id, dto.Name, dto.Description, dto.Price, dto.Stock);

                       var product = new Product(
                       seller.Id,
                       dto.Name,
                       dto.Description,
                       dto.Price,
                       dto.Stock,
                       dto.CategoryId);

                await _productRepo.AddAsync(product);
                await _productRepo.SaveChangesAsync();

                if (dto.Variants != null && dto.Variants.Any())
                {
                    foreach (var v in dto.Variants)
                    {
                        var variant = new ProductVariant(product.Id, v.Label, v.Price, v.Stock, v.Sku);
                        _dbContext.Set<ProductVariant>().Add(variant);
                    }
                    await _dbContext.SaveChangesAsync();
                }

                var productImage = new ProductImage
                {
                    ProductId = product.Id,
                    ImageUrl = imageUrl,
                    IsPrimary = true
                };

                await _productImageRepo.AddAsync(productImage);
                await _productImageRepo.SaveChangesAsync();

                return new ApiResponse<string>(200, "Product created Successfully");
            }
            catch (Exception ex)
            {
                return new ApiResponse<string>(400, ex.Message);
            }
        }

        public async Task<ApiResponse<string>> UpdateProduct(int productId, UpdateProductDto dto, int userId)
        {
            if (dto == null)
                return new ApiResponse<string>(400, "Invalid request");

            // 🔍 Validate Name
            if (string.IsNullOrWhiteSpace(dto.Name))
                return new ApiResponse<string>(400, "Product name is required");

            if (dto.Name.Length > 150)
                return new ApiResponse<string>(400, "Product name too long");

            // 🔍 Validate Description (optional but controlled)
            if (!string.IsNullOrEmpty(dto.Description) && dto.Description.Length > 1000)
                return new ApiResponse<string>(400, "Description too long");

            // 🔍 Validate Price
            if (dto.Price <= 0)
                return new ApiResponse<string>(400, "Price must be greater than zero");

            if (dto.Stock <= 0)
                return new ApiResponse<string>(400, "Stock must be greater than zero");
            if (dto.CategoryId <= 0)
                return new ApiResponse<string>(400, "Category is required");

            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null || product.IsDeleted)
                return new ApiResponse<string>(404, "Product not found");

            //if (dto.Price > 1_000_000) // optional business rule
            //    return new ApiResponse<string>(400, "Price is too high");

            // 🔍 Seller validation
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            if (seller.Status != ApprovalStatus.Approved)
                return new ApiResponse<string>(403, "Seller not approved");

            // 🔍 Product validation
            if (product.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");

            var category = await _categoryRepo.GetByIdAsync(dto.CategoryId);
            if (category == null)
                return new ApiResponse<string>(400, "Category does not exist");
            if (!category.IsActive)
                return new ApiResponse<string>(400, "Category is inactive");

            try
            {
                // 🔍 Handle Variants
                var existingVariants = await _dbContext.Set<ProductVariant>()
                    .Where(v => v.ProductId == productId)
                    .ToListAsync();

                if (dto.Variants != null)
                {
                    // Remove variants not in the new list
                    var newIds = dto.Variants.Select(v => v.Id).Where(id => id > 0).ToList();
                    var toRemove = existingVariants.Where(v => !newIds.Contains(v.Id)).ToList();
                    foreach (var v in toRemove) v.IsDeleted = true;

                    // Add or Update
                    foreach (var vDto in dto.Variants)
                    {
                        if (vDto.Id > 0)
                        {
                            var v = existingVariants.FirstOrDefault(x => x.Id == vDto.Id);
                            if (v != null) v.Update(vDto.Label, vDto.Price, vDto.Stock, vDto.Sku);
                        }
                        else
                        {
                            _dbContext.Set<ProductVariant>().Add(new ProductVariant(productId, vDto.Label, vDto.Price, vDto.Stock, vDto.Sku));
                        }
                    }
                }
                else
                {
                    // If Variants is null in DTO, we might want to keep existing or clear them. 
                    // Usually null means "no change" in some APIs, but here we'll assume empty means clear.
                    // For safety, let's only act if it's NOT null.
                }

                // 🧠 Domain handles internal consistency
                product.Update(dto.Name.Trim(), dto.Description?.Trim(),dto.Stock, dto.Price);
                product.UpdateCategory(dto.CategoryId);

                await _productRepo.SaveChangesAsync();

                await _cache.RemoveAsync($"product:detail:{productId}");
                await _cache.RemoveAsync($"recommendations:{productId}:10"); // default topN
                await _cache.RemoveByPrefixAsync($"recommendations:{productId}:");

                return new ApiResponse<string>(200, "Updated successfully");
            }
            catch (Exception ex)
            {
                // TODO: log ex properly (ILogger)
                return new ApiResponse<string>(500, "Something went wrong");
            }
        }

        public async Task<ApiResponse<string>> UpdateStock(int productId, UpdateStockDto dto, int userId)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null || product.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");

            if (dto.Stock < 0)
                return new ApiResponse<string>(400, "Stock cannot be negative");

            product.UpdateStock(dto.Stock);

            await _productRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Stock updated");
        }
        public async Task<ApiResponse<string>> DeleteProduct(int productId, int userId)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null || product.IsDeleted)
                return new ApiResponse<string>(404, "Product not found");

            if (product.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");

            try
            {
                product.Delete();

                await _productRepo.SaveChangesAsync();

                await _cache.RemoveAsync($"product:detail:{productId}");
                await _cache.RemoveAsync($"recommendations:{productId}:10"); // default topN
                await _cache.RemoveByPrefixAsync($"recommendations:{productId}:"); // all topN variants

                return new ApiResponse<string>(200, "Deleted successfully");
            }
            catch (Exception ex)
            {
                return new ApiResponse<string>(500, "Something went wrong");
            }
        }

        public async Task<ApiResponse<PagedResult<ProductDto>>> GetProducts(int userId, ProductQuery request)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<PagedResult<ProductDto>>(404, "Seller not found");

            var query = _productRepo.Query()
         .AsNoTracking()
         .Include(p => p.Images)
         .Where(p => p.SellerId == seller.Id && !p.IsDeleted);
         
                 if (!string.IsNullOrEmpty(request.Search))
                 {
                     var search = request.Search.ToLower();
         
                     query = query.Where(p =>
                         p.Name.ToLower().Contains(search) ||
                    EF.Functions.Like(p.Name, $"%{search}%")
                );
            }

            if (request.MinPrice.HasValue)
                query = query.Where(p => p.Price >= request.MinPrice);

            if (request.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == request.CategoryId);

            if (request.MaxPrice.HasValue)
                query = query.Where(p => p.Price <= request.MaxPrice);

            query = request.SortBy?.ToLower() switch
            {
                "price" => request.Desc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            var total = await query.CountAsync();

            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    Stock = p.Stock,
                    ImageUrl = p.Images
                        .Where(i => i.IsPrimary)
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault() ?? p.Images
                        .Select(i => i.ImageUrl)
                        .FirstOrDefault()
                })
                .ToListAsync();

            var result = new PagedResult<ProductDto>(200,"succes",items, total, request.Page, request.PageSize);

            return new ApiResponse<PagedResult<ProductDto>>(200, "Success", result);
        }
        public async Task<ApiResponse<string>> AddImages(int productId, int userId, List<IFormFile> files)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null || product.IsDeleted)
                return new ApiResponse<string>(404, "Product not found");

            

            
            if (product.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");
            if (files == null || !files.Any())
                return new ApiResponse<string>(400, "No files uploaded");

            foreach (var file in files)
            {

                if (!file.ContentType.StartsWith("image/"))
                    return new ApiResponse<string>(400, "Invalid file type");

                if (file.Length > 5 * 1024 * 1024)
                    return new ApiResponse<string>(400, "File too large");
            }
            var existingImages = await _productImageRepo.GetByProductIdAsync(productId);

            foreach (var file in files)
            {
                var url = await _fileService.UploadAsync(file, "products");

                var image = new ProductImage
                {
                    ProductId = productId,
                    ImageUrl = url,
                    IsPrimary = !existingImages.Any()
                };

                await _productImageRepo.AddAsync(image);
            }

            await _productImageRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Images added");
        }
        public async Task<ApiResponse<string>> DeleteImage(int imageId, int userId)
        {
            var image = await _productImageRepo.GetByIdAsync(imageId);
            if (image == null)
                return new ApiResponse<string>(404, "Image not found");

            var product = await _productRepo.GetByIdAsync(image.ProductId);
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null || product.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");

            await _productImageRepo.RemoveAsync(image);
            await _productImageRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Image deleted");
        }

        public async Task<ApiResponse<string>> SetPrimaryImage(int imageId, int userId)
        {
            var image = await _productImageRepo.GetByIdAsync(imageId);
            if (image == null)
                return new ApiResponse<string>(404, "Image not found");

            var product = await _productRepo.GetByIdAsync(image.ProductId);
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null || product.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");

            var images = await _productImageRepo.GetByProductIdAsync(product.Id);

            foreach (var img in images)
                img.IsPrimary = false;

            image.IsPrimary = true;

            await _productImageRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Primary image updated");
        }
        public async Task<ApiResponse<SellerProductDetailsDto>> GetProductById(int productId, int userId)
        {
            try 
            {
                Console.WriteLine($"[TRACE] GetProductById: Start for ProductId={productId}, UserId={userId}");
                
                var cacheKey = $"product:detail:{productId}";
                var cached = await _cache.GetAsync<SellerProductDetailsDto>(cacheKey);
                if (cached is not null) 
                {
                    Console.WriteLine($"[TRACE] GetProductById: Cache hit for {cacheKey}");
                    return new ApiResponse<SellerProductDetailsDto>(200, "Success", cached);
                }

                Console.WriteLine($"[TRACE] GetProductById: Cache miss, fetching seller for UserID={userId}");
                var seller = await _sellerRepo.GetByUserIdAsync(userId);
                if (seller == null)
                {
                    Console.WriteLine($"[TRACE] GetProductById: Seller NOT FOUND for UserID={userId}");
                    return new ApiResponse<SellerProductDetailsDto>(404, "Seller not found");
                }
                Console.WriteLine($"[TRACE] GetProductById: Found Seller ID={seller.Id}");

                Console.WriteLine($"[TRACE] GetProductById: Querying database for Product {productId}");
                var product = await _productRepo.Query()
                    .AsNoTracking()
                    .Include(p => p.Images)
                    .Include(p => p.Variants)
                    .FirstOrDefaultAsync(p => p.Id == productId && !p.IsDeleted);

                if (product == null)
                {
                    Console.WriteLine($"[TRACE] GetProductById: Product {productId} NOT FOUND or deleted");
                    return new ApiResponse<SellerProductDetailsDto>(404, "Product not found");
                }

                if (product.SellerId != seller.Id)
                {
                    Console.WriteLine($"[TRACE] GetProductById: UNAUTHORIZED access to Product {productId} by Seller {seller.Id}");
                    return new ApiResponse<SellerProductDetailsDto>(403, "Unauthorized");
                }

                Console.WriteLine($"[TRACE] GetProductById: Mapping Product {productId} (Images: {product.Images?.Count ?? 0}, Variants: {product.Variants?.Count ?? 0})");
                
                var dto = new SellerProductDetailsDto
                {
                    Id = product.Id,
                    Name = product.Name ?? string.Empty,
                    Description = product.Description ?? string.Empty,
                    Price = product.Price,
                    Stock = product.Stock,
                    CategoryId = product.CategoryId,
                    Images = (product.Images ?? new List<ProductImage>())
                        .OrderByDescending(i => i.IsPrimary)
                        .Select(i => new ProductImageDto
                        {
                            Id = i.Id,
                            Url = i.ImageUrl ?? string.Empty,
                            IsPrimary = i.IsPrimary
                        })
                        .ToList(),
                    Variants = (product.Variants ?? new List<ProductVariant>())
                        .Select(v => new ProductVariantDto
                        {
                            Id = v.Id,
                            Label = v.Label ?? "Standard",
                            Price = v.Price,
                            Stock = v.Stock,
                            Sku = v.Sku
                        }).ToList()
                };

                Console.WriteLine($"[TRACE] GetProductById: Mapping complete, setting cache for {cacheKey}");
                await _cache.SetAsync(cacheKey, dto, TimeSpan.FromMinutes(_cfg.ProductDetailTtlMinutes));

                return new ApiResponse<SellerProductDetailsDto>(200, "Success", dto);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[CRITICAL] SellerProductService.GetProductById Failure: {ex.Message}");
                Console.WriteLine(ex.StackTrace);
                throw; // Re-throw to be caught by Controller's catch block
            }
        }
        public async Task<ApiResponse<List<CategoryDto>>> GetCategories()
        {
            var categories = await _categoryRepo.Query()
                .Where(c => c.IsActive)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    IsActive = true 
                })
                .ToListAsync();

            return new ApiResponse<List<CategoryDto>>(200, "Success", categories);
        }
    }
}
