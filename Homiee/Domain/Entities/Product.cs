namespace Homiee.Domain.Entities
{
    public class Product : BaseEntity
    {
        public int Id { get; private set; }
        public int SellerId { get; private set; }

        public string Name { get; private set; }
        public string Description { get; private set; }
        public decimal Price { get; private set; }
        public int Stock { get; private set; }
        public Seller Seller { get; set; }

        //public string Status { get; set; }
        public bool IsDeleted { get; private set; } = false;

        public bool IsAvailable => Stock > 0;

        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public int CategoryId { get; private set; }
        public Category Category { get; set; }
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public Product(int sellerId, string name, string description, decimal price, int stock, int categoryId)
        {
            SellerId = sellerId;
            CategoryId = categoryId;
            Update(name, description, price);
            UpdateStock(stock);
        }

        public void Update(string name, string description, decimal price)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new Exception("Product name required");

            if (price <= 0)
                throw new Exception("Price must be greater than 0");

            Name = name;
            Description = description;
            Price = price;
        }
        public void UpdateBasicDetails(string name, string description, decimal price)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new Exception("Product name required");

            if (price <= 0)
                throw new Exception("Price must be greater than 0");

            Name = name;
            Description = description;
            Price = price;
        }
        public void UpdateStock(int newStock)
        {
            if (newStock < 0)
                throw new Exception("Stock cannot be negative");

            Stock = newStock;
        }
        public void Delete()
        {
            if (Stock > 0)
                throw new Exception("Cannot delete product with stock");

            IsDeleted = true;
        }
        public void ReduceStock(int quantity)
        {
            if (quantity <= 0)
                throw new Exception("Invalid quantity");

            if (Stock < quantity)
                throw new Exception("Insufficient stock");

            Stock -= quantity;
        }
    }
}
