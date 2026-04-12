using System.ComponentModel.DataAnnotations;
    namespace Homiee.Application.DTOs
{
    public class VerifyOtpDto
    {
        [Required]
        public string Email { get; set; }


        [Required]
        public string Otp { get; set; }


    }
}
