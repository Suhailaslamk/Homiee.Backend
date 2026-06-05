using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Modules.Identity.Application.IServices;
using Homiee.Modules.Notifications.Application.IServices;
using Homiee.Shared.Common;
using Homiee.Shared.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;


namespace Homiee.Modules.Identity.Application.Services
{
    public class AdminSellerService : IAdminSellerService
    {
        
        private readonly ISellersRepository _sellerRepo;
        private readonly INotificationService _notificationService;
        private readonly ILogger<AdminSellerService> _logger;


        public AdminSellerService(ISellersRepository sellerRepo, INotificationService notificationService, ILogger<AdminSellerService> logger)
        {
            _sellerRepo = sellerRepo;
            _notificationService = notificationService;
            _logger = logger;
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
                CreatedAt = s.CreatedOn,
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
                BusinessProofUrl = SanitizeUrl(seller.BusinessProofUrl),
                IdentityProofUrl = SanitizeUrl(seller.IdentityProofUrl),
                Status = seller.Status.ToString(),
                seller.RejectionReason
            });
        }

        private string? SanitizeUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return url;
            int queryIndex = url.IndexOf('?');
            return queryIndex > 0 ? url.Substring(0, queryIndex) : url;
        }

            public async Task<ApiResponse<string>> ApproveSeller(int userId)
            {
                _logger.LogInformation("Admin attempt to approve Seller for User #{UserId}", userId);

                var seller = await _sellerRepo.GetWithUserAsync(userId);

                if (seller == null)
                {
                    _logger.LogWarning("Approval failed: Seller record for User #{UserId} not found", userId);
                    return new ApiResponse<string>(404, "Seller not found");
                }

            if (seller.Status == ApprovalStatus.Approved)
            {
                _logger.LogInformation("Seller for User #{UserId} is already approved", userId);
                return new ApiResponse<string>(400, "Seller is already approved");
            }

            if (seller.Status == ApprovalStatus.Suspended)
            {
                _logger.LogWarning("Approval blocked: Seller for User #{UserId} is currently suspended", userId);
                return new ApiResponse<string>(400, "Seller is suspended. Unsuspend before approving");
            }

            if (seller.Status == ApprovalStatus.Draft)
            {
                _logger.LogWarning("Approval blocked: Seller for User #{UserId} application is still in Draft", userId);
                return new ApiResponse<string>(400, "Seller has not submitted their application yet");
            }

            if (seller.Status != ApprovalStatus.Submitted)
            {
                _logger.LogWarning("Approval blocked: Seller for User #{UserId} status is {CurrentStatus}, not Submitted", userId, seller.Status);
                return new ApiResponse<string>(400, "Seller is not ready for approval");
            }

            seller.Approve();
            seller.User.Role = UserRole.Seller;

            try 
            {
                await _sellerRepo.SaveChangesAsync();
                _logger.LogInformation("Successfully approved Seller for User #{UserId}. Role updated to Seller.", userId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save approval for Seller User #{UserId}", userId);
                throw;
            }

            try
            {
                await _notificationService.SendAsync(
                    userId,
                    "Approved",
                    "Admin approved your seller application"
                );
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Approval notification failed for User #{UserId}", userId);
            }
            return new ApiResponse<string>(200, "Seller approved");
            }

        public async Task<ApiResponse<string>> RejectSeller(int userId, string reason)
        {
            _logger.LogInformation("Admin attempt to reject Seller for User #{UserId}. Reason: {Reason}", userId, reason);

            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
            {
                _logger.LogWarning("Rejection failed: Seller record for User #{UserId} not found", userId);
                return new ApiResponse<string>(404, "Seller not found");
            }

            // 🔥 PREVENT invalid state BEFORE calling domain
            if (seller.Status == ApprovalStatus.Approved)
            {
                _logger.LogWarning("Rejection blocked: Seller for User #{UserId} is already approved", userId);
                return new ApiResponse<string>(400, "Approved seller cannot be rejected");
            }

            if (seller.Status != ApprovalStatus.Submitted)
            {
                _logger.LogWarning("Rejection blocked: Seller for User #{UserId} status is {CurrentStatus}, not Submitted", userId, seller.Status);
                return new ApiResponse<string>(400, "Only submitted sellers can be rejected");
            }

            try
            {
                seller.Reject(reason);
                await _sellerRepo.SaveChangesAsync();
                _logger.LogInformation("Successfully rejected Seller for User #{UserId}. Reason: {Reason}", userId, reason);

                try
                {
                    await _notificationService.SendAsync(
                        userId,
                        "Rejected",
                        $"Admin rejected your seller application. Reason: {reason}"
                    );
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Rejection notification failed for User #{UserId}", userId);
                }

                return new ApiResponse<string>(200, "Seller rejected successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to reject Seller for User #{UserId}", userId);
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

