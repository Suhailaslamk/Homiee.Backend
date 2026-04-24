namespace Homiee.Domain.Entities
{
    public class Wishlist : BaseEntity
    {
        public int UserId { get; private set; }
        public int ProductId { get; private set; }
        public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

        public User User { get; private set; }
        public Product Product { get; private set; }

        private Wishlist() { }

        public Wishlist(int userId, int productId)
        {
            UserId = userId;
            ProductId = productId;
        }
    }
}