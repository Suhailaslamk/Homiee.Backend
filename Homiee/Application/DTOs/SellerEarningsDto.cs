namespace Homiee.Application.DTOs
{
   
        public class SellerEarningsDto
        {
        public decimal TotalEarned { get; set; }
        public decimal PendingAmount { get; set; }
        public decimal AvailableAmount { get; set; }
        public decimal PaidOutAmount { get; set; }
        public List<EarningItemDto> Earnings { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }
    }

