using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Application.DTOs;  

using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using static Homiee.Application.Services.AdminSellerService;

namespace Homiee.Application.Services
{
    public class AdminSellerService : IAdminSellerService
    {
        
            private readonly ISellersRepository _sellerRepo;
        

            public AdminSellerService(ISellersRepository sellerRepo)
            {
                _sellerRepo = sellerRepo;
            }

        public async Task<PagedResult<SellerListDto>> GetSellers(SellerQueryParamsDto queryParams)
        {
            var result = await _sellerRepo.GetFilteredAsync(queryParams);

            var mapped = result.Data.Select(s => new SellerListDto
            {
                UserId = s.UserId,
                BusinessName = s.BusinessName,
                PhoneNumber = s.PhoneNumber,
                GSTNumber = s.GSTNumber,
                Status = s.Status.ToString(),
                Email = s.User.Email,
                Name = s.User.Name
            }).ToList();

            return new PagedResult<SellerListDto>
            {
                StatusCode = 200, // ✅ FIXED
                Message = "Sellers fetched",
                Data = mapped, // ✅ FIXED TYPE
                TotalCount = result.TotalCount,
                Page = result.Page,
                PageSize = result.PageSize
            };
        }

        public async Task<ApiResponse<object>> GetSellerDetails(int userId)
            {
                var seller = await _sellerRepo.GetByUserIdAsync(userId);

                if (seller == null)
                    return new ApiResponse<object>(404, "Seller not found");

                return new ApiResponse<object>(200, "Seller details", new
                {
                    seller.BusinessName,
                    seller.Address,
                    seller.PhoneNumber,
                    seller.GSTNumber,
                    seller.BusinessProofUrl,
                    seller.IdentityProofUrl,
                    seller.Status,
                    seller.RejectionReason
                });
            }

            public async Task<ApiResponse<string>> ApproveSeller(int userId)
            {
                var seller = await _sellerRepo.GetByUserIdAsync(userId);

                if (seller == null)
                    return new ApiResponse<string>(404, "Seller not found");

                if (seller.Status != ApprovalStatus.Submitted)
                    return new ApiResponse<string>(400, "Seller not ready for approval");

                

            seller.Approve();

            await _sellerRepo.SaveChangesAsync();

                return new ApiResponse<string>(200, "Seller approved");
            }

            public async Task<ApiResponse<string>> RejectSeller(int userId, string reason)
            {
                var seller = await _sellerRepo.GetByUserIdAsync(userId);

                if (seller == null)
                    return new ApiResponse<string>(404, "Seller not found");

                if (string.IsNullOrWhiteSpace(reason))
                    return new ApiResponse<string>(400, "Rejection reason required");

            seller.Reject(reason);

                await _sellerRepo.SaveChangesAsync();

                return new ApiResponse<string>(200, "Seller rejected");
            }
        }
    }

