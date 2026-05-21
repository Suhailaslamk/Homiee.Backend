namespace Homiee.Application.DTOs
{
    public class ProductVariantDto
    {
        public int Id { get; set; }
        public string Label { get; set; } = default!;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string? Sku { get; set; }
    }
}
