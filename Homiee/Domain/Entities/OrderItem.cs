namespace Homiee.Domain.Entities
{
    public class OrderItem : BaseEntity
    {

        public int OrderId { get; private set; }
        public string ProductName { get; private set; }
        public int ProductId { get; private set; }

        public int SellerId { get; private set; }

        public int Quantity { get; private set; }
        public decimal Price { get; private set; }

        public Order Order { get; set; }
        public Product Product { get; set; }

        private OrderItem() { }

        public OrderItem(int productId, int sellerId, int quantity, decimal price, string productName)
        {
            ProductId = productId;
            SellerId = sellerId;
            Quantity = quantity;
            Price = price;
            ProductName = productName;
        }
    }
}