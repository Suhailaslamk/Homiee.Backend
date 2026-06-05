namespace Homiee.Modules.Analytics.Applications.Dtos
{
    public class RevenueByDayDto
    {
        public string Date { get; set; } = string.Empty;   // "2025-01-15"
        public decimal Revenue { get; set; }
        public int Orders { get; set; }
    }
}
