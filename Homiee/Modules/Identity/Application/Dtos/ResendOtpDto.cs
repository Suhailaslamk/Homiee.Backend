using System.ComponentModel.DataAnnotations;

namespace Homiee.Modules.Identity.Application.Dtos
{
    public class ResendOtpDto
    {
        [Required]
        public string Email { get; set; }
        
    }
}
