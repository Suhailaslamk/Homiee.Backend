using Microsoft.EntityFrameworkCore;
using Homiee.Modules.Catalog.Domain.Entities;
using Homiee.Shared.Common;
using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Modules.Catalog.Application.IServices;
using Homiee.Modules.Catalog.Application.IRepository;
using Homiee.Modules.Notifications.Application.IServices;

namespace Homiee.Modules.Catalog.Application.Services
{
    public class AdminProductService : IAdminProductService
    {
        private readonly IProductRepository _productRepo;
                private readonly INotificationService _notificationService;

        public AdminProductService(IProductRepository productRepo, INotificationService notificationService)
        {
            _productRepo = productRepo;
            _notificationService = notificationService;
        }

        public async Task<ApiResponse<PagedResult<AdminProductDto>>> GetAll(AdminProductQueryDto request)
        {
            var query = _productRepo.Query()
                .Include(p => p.Images)
                .Include(p => p.Seller)
                .ThenInclude(s => s.User) 
                .AsNoTracking();

            if (!string.IsNullOrEmpty(request.Search))
            {
                var search = request.Search.ToLower();
                query = query.Where(p =>
                   EF.Functions.Like(p.Name, $"%{search}%") ||
                    (p.Description != null && p.Description.ToLower().Contains(search))
                );
            }

            if (request.CategoryId.HasValue)
                query = query.Where(p => p.CategoryId == request.CategoryId);

            //if (!string.IsNullOrEmpty(request.Status))
            //{
            //    if (Enum.TryParse<ProductStatus>(request.Status, true, out var status))
            //        query = query.Where(p => p.Status == status);
            //}


            query = request.SortBy?.ToLower() switch
            {
                "price" => request.Desc ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
                "name" => request.Desc ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                "stock" => request.Desc ? query.OrderByDescending(p => p.Stock) : query.OrderBy(p => p.Stock),
                _ => query.OrderByDescending(p => p.CreatedAt)
            };

            var total = await query.CountAsync();

            var items = await query
                .Skip((request.Page - 1) * request.PageSize)
                .Take(request.PageSize)
                .Select(p => new AdminProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Price = p.Price,
                    SellerName = p.Seller.User.Name,
                    SellerId = p.SellerId,
                    IsDeleted = p.IsDeleted,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            var result = new PagedResult<AdminProductDto>(200, "Success", items, total, request.Page, request.PageSize);

            return new ApiResponse<PagedResult<AdminProductDto>>(200, "Success", result);
        }

        public async Task<ApiResponse<AdminProductDetailsDto>> GetById(int id)
        {
            var product = await _productRepo.Query()
                .Include(p => p.Images)
                .Include("Seller.User")
                .FirstOrDefaultAsync(p => p.Id == id);

            if (product == null)
                return new ApiResponse<AdminProductDetailsDto>(404, "Product not found");

            var dto = new AdminProductDetailsDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                SellerId = product.SellerId,                    // ADD
                SellerName = product.Seller?.User?.Name,
                SellerEmail = product.Seller?.User?.Email,         // ADD
                SellerPhone = product.Seller?.PhoneNumber,         // ADD
                SellerBusinessName = product.Seller?.BusinessName,        // ADD
                SellerStatus = product.Seller?.Status.ToString(),   // ADD
                Images = product.Images.Select(i => i.ImageUrl).ToList()
            };

            return new ApiResponse<AdminProductDetailsDto>(200, "Success", dto);
        }

        //public async Task<ApiResponse<string>> Approve(int id)
        //{
        //    var product = await _productRepo.GetByIdAsync(id);

        //    if (product == null)
        //        return new ApiResponse<string>(404, "Product not found");

        //    try
        //    {
        //        product.Approve();
        //        await _productRepo.SaveChangesAsync();

        //        return new ApiResponse<string>(200, "Product approved");
        //    }
        //    catch
        //    {
        //        return new ApiResponse<string>(400, "Invalid state");
        //    }
        //}

        //public async Task<ApiResponse<string>> Reject(int id, string reason)
        //{
        //    var product = await _productRepo.GetByIdAsync(id);

        //    if (product == null)
        //        return new ApiResponse<string>(404, "Product not found");

        //    try
        //    {
        //        product.Reject(reason);
        //        await _productRepo.SaveChangesAsync();

        //        return new ApiResponse<string>(200, "Product rejected");
        //    }
        //    catch
        //    {
        //        return new ApiResponse<string>(400, "Invalid state");
        //    }
        //}

        public async Task<ApiResponse<string>> Delete(int id)
        {
            var product = await _productRepo.GetByIdAsync(id);

            if (product == null)
                return new ApiResponse<string>(404, "Product not found");

            try
            {
                product.Delete();
                await _productRepo.SaveChangesAsync();
                await _notificationService.SendAsync(
                    product.SellerId,
                    "Product Deleted",
                    $"Your product '{product.Name}' has been deleted by admin");
                return new ApiResponse<string>(200, "Product deleted");
            }
            catch (Exception ex)
            {
                return new ApiResponse<string>(400, ex.Message);
            }
        }
    }
}

