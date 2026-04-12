namespace Homiee.Application.DTOs
{
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }

        public SellerDto? Seller { get; set; }
        public DeliveryDto? Delivery { get; set; }
    }
}
