namespace Homiee.Modules.Analytics.Applications.Dtos
{
    public class AdminEarningsSummaryDto
    {
        public decimal TotalPendingPayouts { get; set; }
        public decimal TotalAvailablePayouts { get; set; }
        public decimal TotalPaidOut { get; set; }
        public int SellersWithPendingPayout { get; set; }
    }
}
