namespace Homiee.Application.DTOs
{
    public class SellerListDto
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string BusinessName { get; set; }
        public string PhoneNumber { get; set; }
        public string? GSTNumber { get; set; }
        public string Status { get; set; }
        public string Email { get; set; }
        public string Name { get; set; }
        public int  ProductCount { get; set; }

        public string Address { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
