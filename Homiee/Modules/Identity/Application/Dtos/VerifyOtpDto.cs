using System.ComponentModel.DataAnnotations;
namespace Homiee.Modules.Identity.Application.Dtos
{
    public class VerifyOtpDto
    {
        [Required]
        public string Email { get; set; }


        [Required]
        public string Otp { get; set; }


    }
}
