using FluentAssertions.Execution;
using Homiee.Application.DTOs;  
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Net.NetworkInformation;
using static Homiee.Application.Services.AdminSellerService;

namespace Homiee.Application.Services
{
    public class AdminSellerService : IAdminSellerService
    {
        
            private readonly ISellersRepository _sellerRepo;
        private readonly INotificationService _notificationService;


        public AdminSellerService(ISellersRepository sellerRepo, INotificationService notificationService)
            {
                _sellerRepo = sellerRepo;
                _notificationService = notificationService;
            }

        public async Task<PagedResult<SellerListDto>> GetSellers(SellerQueryParamsDto queryParams)
        {
            var result = await _sellerRepo.GetFilteredAsync(queryParams);

            var mapped = result.Data.Select(s => new SellerListDto
            {
                Id = s.Id,           // ADD THIS — this is the Seller table PK
                UserId = s.UserId,
                BusinessName = s.BusinessName,
                PhoneNumber = s.PhoneNumber,
                GSTNumber = s.GSTNumber,
                Status = s.Status.ToString(),
                Email = s.User.Email,
                Name = s.User.Name,
                Address = s.Address,
                ProductCount = s.Products?.Count(p => !p.IsDeleted) ?? 0 // ADD THIS (was also null — see bug 15)
                                                                         // ProductCount — see bug 15 below
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
                    Status = seller.Status.ToString(),
                    seller.RejectionReason
                });
            }

            public async Task<ApiResponse<string>> ApproveSeller(int userId)
            {
                var seller = await _sellerRepo.GetByUserIdAsync(userId);

                if (seller == null)
                    return new ApiResponse<string>(404, "Seller not found");

            if (seller.Status == ApprovalStatus.Approved)
                return new ApiResponse<string>(400, "Seller is already approved");

            if (seller.Status == ApprovalStatus.Suspended)
                return new ApiResponse<string>(400, "Seller is suspended. Unsuspend before approving");

            if (seller.Status == ApprovalStatus.Draft)
                return new ApiResponse<string>(400, "Seller has not submitted their application yet");

            if (seller.Status != ApprovalStatus.Submitted)
                return new ApiResponse<string>(400, "Seller is not ready for approval");



            seller.Approve();

            await _sellerRepo.SaveChangesAsync();
            await _notificationService.SendAsync(
    userId,
    "Approved",
    "Admin approved your seller application"
);
            return new ApiResponse<string>(200, "Seller approved");
            }

        public async Task<ApiResponse<string>> RejectSeller(int userId, string reason)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            // 🔥 PREVENT invalid state BEFORE calling domain
            if (seller.Status == ApprovalStatus.Approved)
                return new ApiResponse<string>(400, "Approved seller cannot be rejected");

            if (seller.Status != ApprovalStatus.Submitted)
                return new ApiResponse<string>(400, "Only submitted sellers can be rejected");
            try
            {
                seller.Reject(reason);

                await _sellerRepo.SaveChangesAsync();

                await _notificationService.SendAsync(
    userId,
    "Rejected",
    $"Admin rejected your seller application. Reason: {reason}"
);

                return new ApiResponse<string>(200, "Seller rejected successfully");
            }
            catch (Exception ex)
            {
                return new ApiResponse<string>(400, ex.Message);
            }
        }
        public async Task<ApiResponse<string>> SuspendSeller(int userId, string reason)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            try
            {
                seller.Suspend(reason);
                await _sellerRepo.SaveChangesAsync();
                await _notificationService.SendAsync(
    userId,
    "Suspended",
    $"Admin suspended your seller account. Reason: {reason}"
);
                return new ApiResponse<string>(200, "Seller suspended successfully");
            }
            catch (Exception ex)
            {
                return new ApiResponse<string>(400, ex.Message);
            }
        }

    }

    }

