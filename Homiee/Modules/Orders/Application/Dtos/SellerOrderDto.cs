namespace Homiee.Modules.Orders.Application.Dtos
{
    public class SellerOrderDto
    {
        public int Id { get; set; }

        public decimal TotalAmount { get; set; }

        public string Status { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }

        // Optional (add later if needed)
        public int ItemCount { get; set; }

        public string CustomerName { get; set; }

        public List<SellerOrderItemsDto> Items { get; set; } = new();
    }
}
