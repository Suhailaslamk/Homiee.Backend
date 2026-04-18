using Homiee.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Homiee.Infrastructure.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
        {
        }



        public DbSet<User> Users { get; set; } = null!;
        public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

        public DbSet<OtpCode> OtpCodes { get; set; } = null!;
        public DbSet<RevokedAccessToken> RevokedAccessTokens { get; set; }

        public DbSet<DeliveryPartner> DeliveryPartners { get; set; } = null!;
        public DbSet<Seller> Sellers { get; set; } = null!;

        public DbSet<Product> Products { get; set; } = null!;

        public DbSet<ProductImage> ProductImages { get; set; } = null!;

        public DbSet<Category> Categories { get; set; }

        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<CartItem> CartItems { get; set; }
        public DbSet<Address> Addresses { get; set; }
        public DbSet<Payment> Payments { get; set; } = null!;
        public DbSet<Review> Reviews { get; set; }
        public DbSet<PendingOrder> PendingOrders { get; set; } = null!;
        public DbSet<ChatMessage> ChatMessages { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<OrderStatusHistory> OrderStatusHistories { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {


            foreach (var relationship in modelBuilder.Model.GetEntityTypes()
         .SelectMany(e => e.GetForeignKeys()))
            {
                relationship.DeleteBehavior = DeleteBehavior.Restrict;
            }

            base.OnModelCreating(modelBuilder);

            // 🔥 Add indexes here
            modelBuilder.Entity<RefreshToken>()
                .HasIndex(x => x.Token)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(x => x.Email)
                .IsUnique();
            modelBuilder.Entity<Seller>()
                .HasOne(s => s.User)
                .WithOne()
                .HasForeignKey<Seller>(s => s.UserId);

            modelBuilder.Entity<DeliveryPartner>()
                .HasOne(d => d.User)
                .WithOne()
                .HasForeignKey<DeliveryPartner>(d => d.UserId);
            modelBuilder.Entity<CartItem>()
                .HasIndex(x => new { x.CustomerId, x.ProductId })
                .IsUnique();

            modelBuilder.Entity<Payment>()
    .HasIndex(x => x.RazorpayOrderId)
    .IsUnique();
            modelBuilder.Entity<Order>()
    .HasOne(o => o.User)
    .WithMany()
    .HasForeignKey(o => o.UserId)
    .OnDelete(DeleteBehavior.Restrict);
            modelBuilder.Entity<OrderItem>()
    .HasOne(oi => oi.Order)
    .WithMany(o => o.Items)
    .HasForeignKey(oi => oi.OrderId)
    .OnDelete(DeleteBehavior.Cascade);
            modelBuilder.Entity<User>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<Product>().HasQueryFilter(x => !x.IsDeleted);
            modelBuilder.Entity<OtpCode>()
    .HasIndex(x => x.UserId);

            modelBuilder.Entity<RevokedAccessToken>()
                .HasIndex(x => x.Token)
                .IsUnique();
        }
    }
}
