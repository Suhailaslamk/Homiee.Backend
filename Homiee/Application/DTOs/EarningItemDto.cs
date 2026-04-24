namespace Homiee.Application.DTOs
{
    public class EarningItemDto
    {
        public int EarningId { get; set; }
        public int OrderId { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; } = string.Empty;   // Pending / Available / Paid
        public DateTime CreatedAt { get; set; }
        public DateTime? AvailableAt { get; set; }
        public DateTime? PaidAt { get; set; }
    }
}
