namespace Homiee.Application.DTOs
{
    public class AdminProductDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }

        public decimal Price { get; set; }
        public int Stock { get; set; }

        public string Status { get; set; }
        public string? RejectionReason { get; set; }

        public string SellerName { get; set; }

        public List<string> Images { get; set; }
    }
}
