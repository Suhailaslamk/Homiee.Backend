namespace Homiee.Application.DTOs
{
    public class AdminProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }

        public string SellerName { get; set; }

        public string Status { get; set; }
        public bool IsDeleted { get; set; }

        public DateTime CreatedAt { get; set; }
    }
}
