//using Homiee.Application.DTOs;
//using Homiee.Application.Interfaces.IRepository;
//using Homiee.Application.Interfaces.IServices;
//using Homiee.Common;
//using Homiee.Domain.Enums;
//using Homiee.Infrastructure.Data;
//using Microsoft.EntityFrameworkCore;
//using System.Text.RegularExpressions;

//namespace Homiee.Application.Services
//{
//    public class ProfileService : IProfileService
//    {
//        private readonly IUserRepository _userRepo;
//        private readonly ISellersRepository _sellerRepo;
//        private readonly IDeliveryRepository _deliveryRepo;
//        private readonly IFileStorageService _fileService;
//        private readonly AppDbContext _context;

//        public ProfileService(
//            IUserRepository userRepo,
//            ISellersRepository sellerRepo,
//            IDeliveryRepository deliveryRepo,
//            IFileStorageService fileService,
//            AppDbContext context)
//        {
//            _userRepo = userRepo;
//            _sellerRepo = sellerRepo;
//            _deliveryRepo = deliveryRepo;
//            _fileService = fileService;
//            _context = context; 
//        }

//        public async Task<ApiResponse<UserProfileDto>> GetProfile(int userId)
//        {
//            var user = await _userRepo.GetByIdAsync(userId);

//            if (user == null)
//                return new ApiResponse<UserProfileDto>(404, "User not found");

//            var result = new UserProfileDto
//            {
//                Id = user.Id,
//                Name = user.Name,
//                Email = user.Email,
//                Role = user.Role.ToString(),
//                ProfilePictureUrl = user.ProfilePictureUrl,
//            };


//            if (user.Role == UserRole.Seller)
//            {
//                var seller = await _sellerRepo.GetByUserIdAsync(userId);

//                if (seller != null)
//                {
//                    result.Seller = new SellerProfileDto
//                    {
//                        BusinessName = seller.BusinessName,
//                        Address = seller.Address,
//                        PhoneNumber = seller.PhoneNumber,
//                        GSTNumber = seller.GSTNumber,
//                        Status = seller.Status.ToString(),
//                        RejectionReason = seller.RejectionReason
//                    };
//                }
//            }


//            if (user.Role == UserRole.DeliveryPartner)
//            {
//                var delivery = await _deliveryRepo.GetByUserIdAsync(userId);

//                if (delivery != null)
//                {
//                    result.Delivery = new DeliveryProfileDto
//                    {
//                        VehicleType = delivery.VehicleType.ToString(),
//                        IsAvailable = delivery.IsAvailable,

//                    };
//                }
//            }

//            return new ApiResponse<UserProfileDto>(200, "Success", result);
//        }


//        public async Task<ApiResponse<string>> UpdateProfile(int currentUserId, string roleClaim, UpdateSellerProfileDto dto)
//        {
//            if (dto == null)
//                return new ApiResponse<string>(400, "Invalid request");

//            // 🔒 Get user
//            var user = await _userRepo.GetByIdAsync(currentUserId);
//            if (user == null)
//                return new ApiResponse<string>(404, "User not found");

//            // 🔒 Prevent admin misuse
//            if (!Enum.TryParse<UserRole>(roleClaim, out var requesterRole))
//                return new ApiResponse<string>(401, "Invalid role");

//            if (requesterRole == UserRole.Admin)
//                return new ApiResponse<string>(403, "Admin cannot modify user profiles here");

//            // 🔒 Basic field validations
//            if (!string.IsNullOrWhiteSpace(dto.Name))
//            {
//                if (!Regex.IsMatch(dto.Name, @"^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$"))
//                    return new ApiResponse<string>(400, "Invalid name format");

//                user.Name = dto.Name.Trim();
//            }

//            // 🔒 Profile picture validation (basic)
//            if (dto.ProfilePicture != null)
//            {
//                if (dto.ProfilePicture.Length > 2 * 1024 * 1024) // 2MB
//                    return new ApiResponse<string>(400, "File too large");

//                var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
//                if (!allowedTypes.Contains(dto.ProfilePicture.ContentType))
//                    return new ApiResponse<string>(400, "Invalid file type");

//                var picUrl = await _fileService.UploadAsync(dto.ProfilePicture, "profiles");
//                user.ProfilePictureUrl = picUrl;
//            }

//            using var transaction = await _context.Database.BeginTransactionAsync();

//            try
//            {
//                // =========================
//                // SELLER UPDATE
//                // =========================
//                if (user.Role == UserRole.Seller)
//                {
//                    var seller = await _sellerRepo.GetByUserIdAsync(currentUserId);
//                    if (seller == null)
//                        return new ApiResponse<string>(404, "Seller not found");

//                    bool requiresReapproval = false;

//                    if (!string.IsNullOrWhiteSpace(dto.BusinessName))
//                    {
//                        seller.BusinessName = dto.BusinessName.Trim();
//                        requiresReapproval = true;
//                    }

//                    if (!string.IsNullOrWhiteSpace(dto.Address))
//                    {
//                        if (dto.Address.Length < 5)
//                            return new ApiResponse<string>(400, "Invalid address");

//                        seller.Address = dto.Address.Trim();
//                    }

//                    if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
//                    {
//                        if (!Regex.IsMatch(dto.PhoneNumber, @"^\d{10}$"))
//                            return new ApiResponse<string>(400, "Invalid phone number");

//                        seller.PhoneNumber = dto.PhoneNumber;
//                    }

//                    if (!string.IsNullOrWhiteSpace(dto.GSTNumber))
//                    {
//                        // Basic GST format check (India)
//                        if (!Regex.IsMatch(dto.GSTNumber, @"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{3}$"))
//                            return new ApiResponse<string>(400, "Invalid GST number");

//                        seller.GSTNumber = dto.GSTNumber;
//                        requiresReapproval = true;
//                    }

//                    if (requiresReapproval)
//                        seller.Status = ApprovalStatus.Submitted;
//                }



//                await _userRepo.SaveChangesAsync();

//                await transaction.CommitAsync();

//                return new ApiResponse<string>(200, "Profile updated successfully");
//            }
//            catch (Exception)
//            {
//                await transaction.RollbackAsync();
//                throw;
//            }
//        }
//    }
//}







using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Enums;
using Homiee.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System.Text.RegularExpressions;

namespace Homiee.Application.Services
{
    public class ProfileService : IProfileService
    {
        private readonly IUserRepository _userRepo;
        private readonly ISellersRepository _sellerRepo;
        private readonly IFileStorageService _fileService;
        private readonly AppDbContext _context;

        public ProfileService(
            IUserRepository userRepo,
            ISellersRepository sellerRepo,
            IFileStorageService fileService,
            AppDbContext context)
        {
            _userRepo = userRepo;
            _sellerRepo = sellerRepo;
            _fileService = fileService;
            _context = context;
        }

        // ✅ GET PROFILE
        public async Task<ApiResponse<UserProfileDto>> GetProfile(int userId)
        {
            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null)
                return new ApiResponse<UserProfileDto>(404, "User not found");

            var result = new UserProfileDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.ToString(),
                ProfilePictureUrl = user.ProfilePictureUrl
            };

            if (user.Role == UserRole.Seller)
            {
                var seller = await _sellerRepo.GetByUserIdAsync(userId);

                if (seller != null)
                {
                    result.Seller = new SellerProfileDto
                    {
                        BusinessName = seller.BusinessName,
                        Address = seller.Address,
                        PhoneNumber = seller.PhoneNumber,
                        GSTNumber = seller.GSTNumber,
                        Status = seller.Status.ToString(),
                        RejectionReason = seller.RejectionReason
                    };
                }
            }

            return new ApiResponse<UserProfileDto>(200, "Success", result);
        }

        // ✅ UPDATE BASIC USER PROFILE (SAFE)
        public async Task<ApiResponse<string>> UpdateUserProfile(
            int userId,
            UpdateUserprofileDto dto)
        {
            var user = await _userRepo.GetByIdAsync(userId);
            if (user == null)
                return new ApiResponse<string>(404, "User not found");

            if (user.Role == UserRole.Admin)
                return new ApiResponse<string>(403, "Admins cannot update profiles via this endpoint");

            //if (user == null || user.Role != UserRole.User)
            //    return new ApiResponse<string>(403, "Only customers can update this");

            if (!string.IsNullOrWhiteSpace(dto.Name))
            {
                if (!Regex.IsMatch(dto.Name, @"^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$"))
                    return new ApiResponse<string>(400, "Invalid name format");

                user.Name = dto.Name.Trim();
            }

            if (dto.ProfilePicture != null)
            {
                if (dto.ProfilePicture.Length > 2 * 1024 * 1024)
                    return new ApiResponse<string>(400, "File too large");

                var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp" };
                if (!allowedTypes.Contains(dto.ProfilePicture.ContentType))
                    return new ApiResponse<string>(400, "Invalid file type");

                var url = await _fileService.UploadAsync(dto.ProfilePicture, "profiles");
                user.ProfilePictureUrl = url;
            }

            await _userRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Profile updated successfully");
        }

        // ✅ UPDATE SELLER PROFILE (CONTROLLED)
        public async Task<ApiResponse<string>> UpdateSellerProfile(
            int userId,
            UpdateSellerProfileDto dto)
        {
            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null || user.Role != UserRole.Seller)
                return new ApiResponse<string>(403, "Only sellers can update this");

            var seller = await _sellerRepo.GetByUserIdAsync(userId);
            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            bool requiresReapproval = false;

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (!string.IsNullOrWhiteSpace(dto.BusinessName))
                {
                    seller.BusinessName = dto.BusinessName.Trim();
                    requiresReapproval = true;
                }

                if (!string.IsNullOrWhiteSpace(dto.Address))
                {
                    if (dto.Address.Length < 5)
                        return new ApiResponse<string>(400, "Invalid address");

                    seller.Address = dto.Address.Trim();
                }

                if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
                {
                    if (!Regex.IsMatch(dto.PhoneNumber, @"^\d{10}$"))
                        return new ApiResponse<string>(400, "Invalid phone number");

                    seller.PhoneNumber = dto.PhoneNumber;
                }

                // 🔥 IMPORTANT: GST NOT editable after approval
                if (seller.Status == ApprovalStatus.Approved && requiresReapproval)
                {
                    seller.Status = ApprovalStatus.Submitted;
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return new ApiResponse<string>(200, "Seller profile updated");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }
    }
}