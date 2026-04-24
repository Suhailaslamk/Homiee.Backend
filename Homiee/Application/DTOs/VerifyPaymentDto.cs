using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
   
        public class VerifyPaymentDto
        {
            [Required]
            public string RazorpayOrderId { get; set; } = string.Empty;

            [Required]
            public string RazorpayPaymentId { get; set; } = string.Empty;

            [Required]
            public string RazorpaySignature { get; set; } = string.Empty;
        }
    
}
