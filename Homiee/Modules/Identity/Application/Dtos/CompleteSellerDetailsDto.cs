using System.ComponentModel.DataAnnotations;

namespace Homiee.Modules.Identity.Application.Dtos
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

        
        public double Latitude { get; set; }

        [Required]
        public double Longitude { get; set; }

        [Required]
        public IFormFile? BusinessProof { get; set; }
        [Required]

        
        public IFormFile? IdentityProof { get; set; }
    }
}
