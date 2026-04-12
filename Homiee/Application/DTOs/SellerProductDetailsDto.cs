namespace Homiee.Application.DTOs
{
    public class SellerProductDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = default!;
        public string Description { get; set; } = default!;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public int CategoryId { get; set; }

        // ✅ ADD THIS
        public List<string> Images { get; set; } = new();
    }
}
