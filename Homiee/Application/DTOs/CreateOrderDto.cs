using Homiee.Application.DTOs;

namespace Homiee.Application.DTOs
{
    public class CreateOrderDto
    {
       
        public int AddressId { get; set; }

        public List<CustomerOrderItemDto> Items { get; set; }
    }
}
