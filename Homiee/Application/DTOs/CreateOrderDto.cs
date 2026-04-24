using Homiee.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
    public class CreateOrderDto
    {
        
        [Required]
        public int AddressId { get; set; }

        public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;

        
        [Required]
        [MinLength(1, ErrorMessage = "Order must contain at least one item.")]
        public List<OrderItemDto> Items { get; set; } = new();
    }


}