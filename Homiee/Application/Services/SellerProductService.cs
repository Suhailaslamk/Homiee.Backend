using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Application.Services
{
    public class SellerProductService : ISellerProductService
    {
        private readonly IProductRepository _productRepo;
        private readonly ISellersRepository _sellerRepo;
        private readonly IProductImageRepository _productImageRepo;
        private readonly IFileStorageService _fileService;
        private readonly ICategoryRepository _categoryRepo;


        public SellerProductService(IProductRepository productRepo,
                                   ISellersRepository sellerRepo,
                                   IProductImageRepository productImageRepo,
                                   IFileStorageService fileService,
                                   ICategoryRepository categoryRepo)
        {
            _productRepo = productRepo;
            _sellerRepo = sellerRepo;
            _productImageRepo = productImageRepo;
            _fileService = fileService;
            _categoryRepo = categoryRepo;
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
            if (!category.IsActive)
                return new ApiResponse<string>(400, "Category is inactive");

            if (dto.Stock < 0)
                return new ApiResponse<string>(400, "Stock cannot be negative");
            try
            {
                var imageUrl = await _fileService.UploadAsync(dto.Image, "productsimages");
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

            if (dto.Price > 1_000_000) // optional business rule
                return new ApiResponse<string>(400, "Price is too high");

            // 🔍 Seller validation
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            if (seller.Status != ApprovalStatus.Approved)
                return new ApiResponse<string>(403, "Seller not approved");

            // 🔍 Product validation
            var product = await _productRepo.GetByIdAsync(productId);
            if (product == null || product.IsDeleted)
                return new ApiResponse<string>(404, "Product not found");

            if (product.SellerId != seller.Id)
                return new ApiResponse<string>(403, "Unauthorized");

            try
            {
                // 🧠 Domain handles internal consistency
                product.Update(dto.Name.Trim(), dto.Description?.Trim(), dto.Price);

                await _productRepo.SaveChangesAsync();

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
                    Stock = p.Stock
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
            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<SellerProductDetailsDto>(404, "Seller not found");

            var product = await _productRepo.Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == productId && !p.IsDeleted);

            if (product == null)
                return new ApiResponse<SellerProductDetailsDto>(404, "Product not found");

            if (product.SellerId != seller.Id)
                return new ApiResponse<SellerProductDetailsDto>(403, "Unauthorized");

            var dto = new SellerProductDetailsDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                CategoryId = product.CategoryId
            };

            return new ApiResponse<SellerProductDetailsDto>(200, "Success", dto);
        }
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
    }
}
