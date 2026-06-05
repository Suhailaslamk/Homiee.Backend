namespace Homiee.Modules.Cart.Application.Dtos
{
    public class AddToCartDto
    {
        public int ProductId { get; set; }
        public int? ProductVariantId { get; set; }
        public int Quantity { get; set; }
    }
}
