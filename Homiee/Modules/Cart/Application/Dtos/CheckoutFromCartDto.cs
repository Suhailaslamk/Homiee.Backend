using System.ComponentModel.DataAnnotations;

namespace Homiee.Modules.Cart.Application.Dtos
{
    public class CheckoutFromCartDto
    {
        [Required]
        public int AddressId { get; set; }
        public DateTime? RequestedDeliveryDate { get; set; }
    }
}
