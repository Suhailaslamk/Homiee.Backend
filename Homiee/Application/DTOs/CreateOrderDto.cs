using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
    public class CreateOrderDto
    {
        
        [Required]
        public int AddressId { get; set; }

        
        [Required]
        [MinLength(1, ErrorMessage = "Order must contain at least one item.")]
        public List<OrderItemDto> Items { get; set; } = new();
    }


}