using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;

using Homiee.Common;
using Homiee.Domain.Entities;
using Homiee.Domain.Enums;
using Microsoft.IdentityModel.Tokens;
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

        public async Task<ApiResponse<string>> CompleteSellerDetails(int userId, CompleteSellerDetailsDto dto)
        {
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

            // validation (same as before)...

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

            if (businessProofUrl != null)
                seller.BusinessProofUrl = businessProofUrl;

            if (identityProofUrl != null)
                seller.IdentityProofUrl = identityProofUrl;

            seller.Status = ApprovalStatus.Submitted;

            await _sellerRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Profile submitted");
        }

        public async Task<ApiResponse<string>> ResubmitSeller(int userId, CompleteSellerDetailsDto dto)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
                return new ApiResponse<string>(404, "Seller not found");

            // ❗ Only rejected sellers can resubmit
            if (seller.Status != ApprovalStatus.Rejected)
                return new ApiResponse<string>(400, "Only rejected sellers can resubmit");

            // upload files again if provided
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

            // update details
            seller.BusinessName = dto.BusinessName;
            seller.Address = dto.Address;
            seller.PhoneNumber = dto.PhoneNumber;
            seller.GSTNumber = dto.GSTNumber;

            seller.BusinessProofUrl = businessProofUrl;
            seller.IdentityProofUrl = identityProofUrl;

            // 🔥 reset status
            seller.Status = ApprovalStatus.Submitted;
            seller.RejectionReason = null;
            seller.ReviewedAt = null;

            await _sellerRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Profile resubmitted successfully");
        }
    }


}
