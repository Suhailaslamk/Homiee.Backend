namespace Homiee.Modules.Catalog.Application.Dtos
{
    public class ProductListDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string? Description { get; set; }   
        public decimal Price { get; set; }
        public bool IsAvailable { get; set; }      
        public int Stock { get; set; }             
        public double AverageRating { get; set; }  
        public int ReviewCount { get; set; }       
        public int SellerId { get; set; }
        public int SellerUserId { get; set; }       // Added to fix chat routing
        public string? SellerName { get; set; }
        public string? BusinessName { get; set; }   
        public string? ImageUrl { get; set; }
        public int CategoryId { get; set; }
        public double? DistanceKm { get; set; }
    }
}
