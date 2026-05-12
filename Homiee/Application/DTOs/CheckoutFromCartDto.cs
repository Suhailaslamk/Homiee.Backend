using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
    public class CheckoutFromCartDto
    {
        [Required]
        public int AddressId { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
    }
}
