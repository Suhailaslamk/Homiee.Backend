using Homiee.Application.DTOs;

namespace Homiee.Application.DTOs
{
    public class CreateOrderDto
    {
        public int Id { get; set; }
        public decimal TotalAmount { get; set; }
        public int AddressId { get; set; }
        public string Status { get; set; }
        public DateTime CreatedAt { get; set; }

        public List<CustomerOrderItemDto> Items { get; set; }
    }
}
