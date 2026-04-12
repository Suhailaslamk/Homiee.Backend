namespace Homiee.Application.DTOs
{
    public class ProductListDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }

        public int SellerId { get; set; }
        public string SellerName { get; set; }

        public string? ImageUrl { get; set; }
    }
}
