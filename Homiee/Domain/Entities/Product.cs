namespace Homiee.Domain.Entities
{
    public class Product : BaseEntity
    {
        public int SellerId { get; private set; }
        public string Name { get; private set; }
        public string Description { get; private set; }
        public decimal Price { get; private set; }
        public int Stock { get; private set; }
        public bool IsDeleted { get; private set; } = false;
        public bool IsAvailable => Stock > 0;
        public double AverageRating { get; private set; } = 0;
        public int ReviewCount { get; private set; } = 0;
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
        public int CategoryId { get; private set; }

        public Seller Seller { get; set; }
        public Category Category { get; set; }
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public ICollection<ProductVariant> Variants { get; set; } = new List<ProductVariant>();

        public bool HasVariants => Variants.Any(v => !v.IsDeleted);

        public Product(int sellerId, string name, string description, decimal price, int stock, int categoryId)
        {
            SellerId = sellerId;
            CategoryId = categoryId;
            Update(name, description,stock , price);
            UpdateStock(stock);
        }

        public void Update(string name, string description,int stock , decimal price)
        {
            if (string.IsNullOrWhiteSpace(name))
                throw new ArgumentException("Product name required");
            if (price <= 0)
                throw new ArgumentException("Price must be greater than 0");
            Name = name;
            Description = description;
            Price = price;
            Stock = stock;
        }

        public void UpdateCategory(int categoryId)
        {
            if (categoryId <= 0)
                throw new ArgumentException("Category is required");

            CategoryId = categoryId;
        }

        // Keep for backward compat
        public void UpdateBasicDetails(string name, string description,int stock , decimal price)
            => Update(name, description, stock , price);

        public void UpdateStock(int newStock)
        {
            if (newStock < 0)
                throw new ArgumentException("Stock cannot be negative");
            Stock = newStock;
        }

        public void Delete()
        {
            if (Stock > 0)
                throw new ArgumentException("Cannot delete product with stock");
            IsDeleted = true;
        }

        public void ReduceStock(int quantity)
        {
            if (quantity <= 0)
                throw new ArgumentException("Invalid quantity");
            if (Stock < quantity)
                throw new ArgumentException("Insufficient stock");
            Stock -= quantity;
        }

        public void UpdateRating(double newAverage, int newCount)
        {
            AverageRating = Math.Round(newAverage, 2);
            ReviewCount = newCount;
        }
    }
}
