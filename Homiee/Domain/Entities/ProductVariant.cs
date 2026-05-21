namespace Homiee.Domain.Entities
{
    public class ProductVariant : BaseEntity
    {
        public int ProductId { get; set; }
        public string Label { get; set; } = default!;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public string? Sku { get; set; }

        public Product Product { get; set; } = default!;

        private ProductVariant() { }

        public ProductVariant(int productId, string label, decimal price, int stock, string? sku = null)
        {
            ProductId = productId;
            Label = label;
            Price = price;
            Stock = stock;
            Sku = sku;
        }

        public void Update(string label, decimal price, int stock, string? sku = null)
        {
            Label = label;
            Price = price;
            Stock = stock;
            Sku = sku;
        }

        public void ReduceStock(int quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("Invalid quantity");
            if (Stock < quantity)
                throw new ArgumentException("Insufficient stock in variant");
            Stock -= quantity;
        }
    }
}
