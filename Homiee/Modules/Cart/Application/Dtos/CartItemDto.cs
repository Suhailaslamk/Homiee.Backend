namespace Homiee.Modules.Cart.Application.Dtos
{
    public class CartItemDto
    {
        public int ProductId { get; set; }
        public int SellerId { get; set; }
        public int? ProductVariantId { get; set; }
        public int Quantity { get; set; }
    }
}
