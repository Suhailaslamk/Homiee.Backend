namespace Homiee.Application.DTOs
{
    public class CustomerOrderDto
    {
        public int Id { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<CustomerOrderItemDto> Items { get; set; }
    }
}
