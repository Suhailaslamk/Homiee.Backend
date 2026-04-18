using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
    public class RegisterSellerDto
    {
        [Required]
        [StringLength(100, MinimumLength = 3)]
        public string FullName { get; set; } = null!;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = null!;

        [Required]
        [MinLength(8)]
        public string Password { get; set; } = null!;

        [Required]
        [StringLength(200)]
        public string BusinessName { get; set; } = null!;

        [Required]
        [StringLength(500)]
        public string Address { get; set; } = null!;
    }

}
