using Homiee.Application.Interfaces.IServices;
using Homiee.Application.Interfaces.IRepository;


using Homiee.Common;
using Homiee.Domain.Enums;

namespace Homiee.Application.Services
{
    public class SellerProfileService : ISellerProfileService
    {
        private readonly ISellersRepository _sellerRepo;

        public SellerProfileService(ISellersRepository sellerRepo)
        {
            _sellerRepo = sellerRepo;
        }

        public async Task<ApiResponse<object>> GetSellerProfile(int userId)
        {
            var seller = await _sellerRepo.GetByUserIdAsync(userId);

            if (seller == null)
                return new ApiResponse<object>(404, "Seller not found");

            var result = new
            {
                seller.BusinessName,
                seller.Address,
                seller.PhoneNumber,
                seller.GSTNumber,
                seller.BusinessProofUrl,
                seller.IdentityProofUrl,
                seller.Status,
                seller.RejectionReason
            };

            return new ApiResponse<object>(200, "Seller profile fetched", result);
        }
    }
}
