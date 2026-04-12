using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
    public class ResendOtpDto
    {
        [Required]
        public string Email { get; set; }
        
    }
}
