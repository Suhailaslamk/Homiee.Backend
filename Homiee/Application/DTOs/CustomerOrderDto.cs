namespace Homiee.Application.DTOs
{
    public class CustomerOrderDto
    {
        public int Id { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string PaymentMethod { get; set; }   
        public DateTime CreatedAt { get; set; }
        public int SellerId { get; set; }
        public string ShopName { get; set; }


        public List<CustomerOrderItemDto> Items { get; set; } = new();
    }
}
