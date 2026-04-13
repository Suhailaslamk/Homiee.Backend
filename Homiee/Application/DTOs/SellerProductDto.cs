namespace Homiee.Application.DTOs
{
    public class SellerProductDto
    {
        
        public string BusinessName { get; set; } = null!;
        public string PhoneNumber { get; set; } = null!;
        public string Status { get; set; } = null!;

        // only approved sellers
        public string? Address { get; set; }
        public string? GSTNumber { get; set; }
        public string? BusinessProofUrl { get; set; }
        public string? IdentityProofUrl { get; set; }
        public string? RejectionReason { get; set; }
    }
}
