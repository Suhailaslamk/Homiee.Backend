using Homiee.Common;

namespace Homiee.Application.DTOs
{
    public class SellerStorePageDto
    {
        
        public int SellerId { get; set; }
        public int SellerUserId { get; set; }
        public string BusinessName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string? PhoneNumber { get; set; }
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public SellerStoreDto Store { get; set; } = null!;
        public PagedResult<ProductListDto> Products { get; set; } = null!;
    }
}
