using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Enums;

namespace Homiee.Application.Services
{
    public class ProfileService : IProfileService
    {
        private readonly IUserRepository _userRepo;
        private readonly ISellersRepository _sellerRepo;
        private readonly IDeliveryRepository _deliveryRepo;

        public ProfileService(
            IUserRepository userRepo,
            ISellersRepository sellerRepo,
            IDeliveryRepository deliveryRepo)
        {
            _userRepo = userRepo;
            _sellerRepo = sellerRepo;
            _deliveryRepo = deliveryRepo;
        }

        // =========================
        // GET PROFILE (ROLE BASED)
        // =========================
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
                Role = user.Role.ToString()
            };

            // SELLER PROFILE
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

            // DELIVERY PROFILE
            if (user.Role == UserRole.DeliveryPartner)
            {
                var delivery = await _deliveryRepo.GetByUserIdAsync(userId);

                if (delivery != null)
                {
                    result.Delivery = new DeliveryProfileDto
                    {
                        VehicleType = delivery.VehicleType.ToString(),
                        IsAvailable = delivery.IsAvailable,
                        
                    };
                }
            }

            return new ApiResponse<UserProfileDto>(200, "Success", result);
        }

        // =========================
        // UPDATE PROFILE (ROLE SAFE)
        // =========================
        public async Task<ApiResponse<string>> UpdateProfile(int userId, UpdateProfileDto dto, UserRole requesterRole)
        {
            var user = await _userRepo.GetByIdAsync(userId);

            if (user == null)
                return new ApiResponse<string>(404, "User not found");

            // =========================
            // ADMIN RULE (IMPORTANT)
            // =========================
            if (requesterRole == UserRole.Admin)
            {
                return new ApiResponse<string>(403, "Admin cannot modify user business profiles here");
            }

            // =========================
            // UPDATE BASIC USER
            // =========================
            if (!string.IsNullOrWhiteSpace(dto.Name))
                user.Name = dto.Name;

            // =========================
            // SELLER UPDATE
            // =========================
            if (user.Role == UserRole.Seller)
            {
                var seller = await _sellerRepo.GetByUserIdAsync(userId);

                if (seller == null)
                    return new ApiResponse<string>(404, "Seller not found");

                if (!string.IsNullOrWhiteSpace(dto.BusinessName))
                    seller.BusinessName = dto.BusinessName;

                if (!string.IsNullOrWhiteSpace(dto.Address))
                    seller.Address = dto.Address;

                if (!string.IsNullOrWhiteSpace(dto.PhoneNumber))
                {
                    if (dto.PhoneNumber.Length != 10)
                        return new ApiResponse<string>(400, "Phone number must be 10 digits");

                    seller.PhoneNumber = dto.PhoneNumber;
                }

                if (!string.IsNullOrWhiteSpace(dto.GSTNumber))
                    seller.GSTNumber = dto.GSTNumber;

                // ⚠️ OPTIONAL RULE: re-approval on change
                seller.Status = ApprovalStatus.Submitted;
            }

            // =========================
            // DELIVERY UPDATE
            // =========================
            if (user.Role == UserRole.DeliveryPartner)
            {
                var delivery = await _deliveryRepo.GetByUserIdAsync(userId);

                if (delivery == null)
                    return new ApiResponse<string>(404, "Delivery not found");

               
               
            }

            await _userRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Profile updated successfully");
        }
    }
}