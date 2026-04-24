using Homiee.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
    public class CheckoutFromCartDto
    {
        [Required]
        public int AddressId { get; set; }

        //public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.COD;
    }
}
