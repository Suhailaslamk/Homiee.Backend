namespace Homiee.Application.DTOs
{
    public class SellerOrderGetDetailsDto
    {
        public int OrderId { get; set; }
        public string Status { get; set; } = default!;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }

        // Customer Info
        public string CustomerName { get; set; } = default!;
        public string CustomerEmail { get; set; } = default!;

        public List<SellerOrderItemsDto> Items { get; set; } = new();
    }
}
