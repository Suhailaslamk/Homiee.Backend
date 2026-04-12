namespace Homiee.Domain.Entities
{
    public class CartItem : BaseEntity
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public int ProductId { get; set; }
        public int SellerId { get; set; }
        public int Quantity { get; set; }
    }
}
