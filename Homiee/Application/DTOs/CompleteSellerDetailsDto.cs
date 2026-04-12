using System.ComponentModel.DataAnnotations;

namespace Homiee.Application.DTOs
{
    public class CompleteSellerDetailsDto
    {
        [Required]
        public string SellerName { get; set; } = null!;
        [Required]

        public string BusinessName { get; set; } = null!;
        [Required]

        public string PhoneNumber { get; set; }
        [Required]

        public string Address { get; set; }
        [Required]

        public string City { get; set; }
        [Required]

        public string State { get; set; }
        [Required]

        public string Pincode { get; set; }
        [Required]

        public string? GSTNumber { get; set; }
        [Required]

        public string? LicenseNumber { get; set; }
        [Required]


        public IFormFile? BusinessProof { get; set; }
        [Required]

        public IFormFile? IdentityProof { get; set; }
    }
}
