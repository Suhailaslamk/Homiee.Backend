namespace Homiee.Modules.Orders.Application.Dtos
{
    public class SellerOrderGetDetailsDto
    {
        public int OrderId { get; set; }
        public string Status { get; set; } = default!;
        public decimal TotalAmount { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }

        // Customer Info
        public string CustomerName { get; set; } = default!;
        public string CustomerEmail { get; set; } = default!;
        public string ShippingFullName { get; set; } = default!;
        public string ShippingPhone { get; set; } = default!;
        public string ShippingLine1 { get; set; } = default!;
        public string ShippingCity { get; set; } = default!;
        public string ShippingState { get; set; } = default!;
        public string ShippingPincode { get; set; } = default!;
        public List<SellerOrderItemsDto> Items { get; set; } = new();
    }
}
