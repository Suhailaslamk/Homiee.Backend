namespace Homiee.Application.DTOs
{
    public class OrderDetailsDto
    {
        public int Id { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
        public List<GetOrderItemDto> Items { get; set; }
    }
}
