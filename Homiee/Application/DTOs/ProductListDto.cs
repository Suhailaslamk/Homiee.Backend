namespace Homiee.Application.DTOs
{
    public class ProductListDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }   // ← NEW
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; }       // ← NEW
        public int Stock { get; set; }              // ← NEW
        public double AverageRating { get; set; }   // ← NEW (will be 0 until Step 4)
        public int ReviewCount { get; set; }        // ← NEW
        public int SellerId { get; set; }
        public string? SellerName { get; set; }
        public string? BusinessName { get; set; }   // ← NEW
        public string? ImageUrl { get; set; }
        public int CategoryId { get; set; }



        public double? DistanceKm { get; set; }
    }
}
