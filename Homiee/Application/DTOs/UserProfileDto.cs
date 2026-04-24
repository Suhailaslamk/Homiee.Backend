namespace Homiee.Application.DTOs
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string Role { get; set; } = null!;

        public string? ProfilePictureUrl { get; set; }
        public SellerProfileDto? Seller { get; set; }
        public DeliveryProfileDto? Delivery { get; set; }
    }
}
