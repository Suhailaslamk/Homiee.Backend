using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using System.Text.RegularExpressions;

namespace Homiee.Application.Services
{
    public class SellerOnboardingService : ISellerOnboardingService
    {
        private readonly ISellersRepository _sellerRepo;
        private readonly IFileStorageService _fileStorageService;

        public SellerOnboardingService(
            ISellersRepository sellerRepo,
            IFileStorageService fileStorageService)
        {
            _sellerRepo = sellerRepo;
            _fileStorageService = fileStorageService;
        }

        // ========================
        // VALIDATION (CORE RULES)
        // ========================
        private ApiResponse<string>? ValidateSeller(CompleteSellerDetailsDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SellerName) ||
                !Regex.IsMatch(dto.SellerName, @"^[a-zA-Z ]{3,50}$"))
                return new ApiResponse<string>(400, "Invalid seller name");

            if (string.IsNullOrWhiteSpace(dto.BusinessName) || dto.BusinessName.Length < 3)
                return new ApiResponse<string>(400, "Business name must be at least 3 characters");

            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) ||
                !Regex.IsMatch(dto.PhoneNumber, @"^[6-9]\d{9}$"))
                return new ApiResponse<string>(400, "Invalid phone number");

            if (string.IsNullOrWhiteSpace(dto.Address) || dto.Address.Length < 10)
                return new ApiResponse<string>(400, "Address too short");

            if (string.IsNullOrWhiteSpace(dto.City) || dto.City.Length < 2)
                return new ApiResponse<string>(400, "Invalid city");

            if (string.IsNullOrWhiteSpace(dto.State) || dto.State.Length < 2)
                return new ApiResponse<string>(400, "Invalid state");

            if (string.IsNullOrWhiteSpace(dto.Pincode) ||
                !Regex.IsMatch(dto.Pincode, @"^\d{6}$"))
                return new ApiResponse<string>(400, "Invalid pincode");

            if (!string.IsNullOrWhiteSpace(dto.GSTNumber) &&
                !Regex.IsMatch(dto.GSTNumber, @"^[0-9A-Z]{15}$"))
                return new ApiResponse<string>(400, "Invalid GST number");

            if (!string.IsNullOrWhiteSpace(dto.LicenseNumber) &&
                dto.LicenseNumber.Length < 5)
                return new ApiResponse<string>(400, "Invalid license number");

            return null;
        }

        // ========================
        // CREATE / SUBMIT SELLER
        // ========================
        public async Task<ApiResponse<string>> CompleteSellerDetails(int userId, CompleteSellerDetailsDto dto)
        {
            


            var validation = ValidateSeller(dto);
            if (validation != null)
                return validation;

            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            

            if (seller == null)
            {
                seller = new Seller
                {
                    UserId = userId,
                    Status = ApprovalStatus.Draft
                };

                await _sellerRepo.AddAsync(seller);
            }
            if (seller.Status == ApprovalStatus.Approved)
                return new ApiResponse<string>(400, "Approved sellers cannot resubmit profile");
            string? businessProofUrl = null;
            string? identityProofUrl = null;

            try
            {
                if (dto.BusinessProof != null)
                    businessProofUrl = await _fileStorageService.UploadAsync(dto.BusinessProof, "business-proofs");

                if (dto.IdentityProof != null)
                    identityProofUrl = await _fileStorageService.UploadAsync(dto.IdentityProof, "identity-proofs");
            }
            catch
            {
                return new ApiResponse<string>(500, "File upload failed");
            }

            seller.BusinessName = dto.BusinessName;
            seller.Address = dto.Address;
            seller.PhoneNumber = dto.PhoneNumber;
            seller.GSTNumber = dto.GSTNumber;
            //seller.LicenseNumber = dto.LicenseNumber;

            if (businessProofUrl != null)
                seller.BusinessProofUrl = businessProofUrl;

            if (identityProofUrl != null)
                seller.IdentityProofUrl = identityProofUrl;

            seller.Status = ApprovalStatus.Submitted;

            await _sellerRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Profile submitted successfully");
        }

        // ========================
        // RESUBMIT SELLER
        // ========================
        public async Task<ApiResponse<string>> ResubmitSeller(int userId, CompleteSellerDetailsDto dto)
        {
            var validation = ValidateSeller(dto);
            if (validation != null)
                return validation;

            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            if (seller.Status != ApprovalStatus.Rejected)
                return new ApiResponse<string>(400, "Only rejected sellers can resubmit");

            string? businessProofUrl = seller.BusinessProofUrl;
            string? identityProofUrl = seller.IdentityProofUrl;

            try
            {
                if (dto.BusinessProof != null)
                    businessProofUrl = await _fileStorageService.UploadAsync(dto.BusinessProof, "business-proofs");

                if (dto.IdentityProof != null)
                    identityProofUrl = await _fileStorageService.UploadAsync(dto.IdentityProof, "identity-proofs");
            }
            catch
            {
                return new ApiResponse<string>(500, "File upload failed");
            }

            seller.BusinessName = dto.BusinessName;
            seller.Address = dto.Address;
            seller.PhoneNumber = dto.PhoneNumber;
            seller.GSTNumber = dto.GSTNumber;
            //seller.LicenseNumber = dto.LicenseNumber;

            seller.BusinessProofUrl = businessProofUrl;
            seller.IdentityProofUrl = identityProofUrl;

            seller.Status = ApprovalStatus.Submitted;
            seller.RejectionReason = null;
            seller.ReviewedAt = null;

            await _sellerRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Profile resubmitted successfully");
        }

        // ========================
        // REJECTION REASON
        // ========================
        public async Task<ApiResponse<object>> GetRejectionReason(int userId)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
                return new ApiResponse<object>(404, "Seller not found");

            if (seller.Status != ApprovalStatus.Rejected)
                return new ApiResponse<object>(400, "Seller is not rejected");

            return new ApiResponse<object>(200, "Rejection details", new
            {
                seller.RejectionReason,
                seller.ReviewedAt
            });
        }
    }
}