namespace Homiee.Application.DTOs
{
    public class AddToCartDto
    {
        public int ProductId { get; set; }
        public int? ProductVariantId { get; set; }
        public int Quantity { get; set; }
    }
}
