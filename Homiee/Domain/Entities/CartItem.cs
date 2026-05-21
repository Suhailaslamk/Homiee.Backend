namespace Homiee.Domain.Entities
{
    public class CartItem : BaseEntity
    {
        public int CustomerId { get; set; }
        public int ProductId { get; set; }
        public int SellerId { get; set; }
        public int? ProductVariantId { get; set; }
        public int Quantity { get; set; }
    }
}
