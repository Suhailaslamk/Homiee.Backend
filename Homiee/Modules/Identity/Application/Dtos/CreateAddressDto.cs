using System.ComponentModel.DataAnnotations;

namespace Homiee.Modules.Identity.Application.Dtos
{
    public class CreateAddressDto
    {
        [Required]
        public string FullName { get; set; }=  string.Empty;
        [Required]
        [Phone]
        public string Phone { get; set; } = string.Empty;
        [Required]
        public  string Line1 { get; set; }
        [Required]
        public string City { get; set; }
        [Required]
        public required string State { get; set; }
        [Required]
        public string Pincode { get; set; }
        
    }
}
