using Homiee.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Homiee.Application.Interfaces.IData;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<OtpCode> OtpCodes { get; }
    DbSet<RevokedAccessToken> RevokedAccessTokens { get; }
    DbSet<DeliveryPartner> DeliveryPartners { get; }
    DbSet<Seller> Sellers { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductImage> ProductImages { get; }
    DbSet<Category> Categories { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<CartItem> CartItems { get; }
    DbSet<Address> Addresses { get; }
    DbSet<Review> Reviews { get; }
    DbSet<PendingOrder> PendingOrders { get; }
    DbSet<ChatMessage> ChatMessages { get; }
    DbSet<Notification> Notifications { get; }
    DbSet<OrderStatusHistory> OrderStatusHistories { get; }
    DbSet<SellerReview> SellerReviews { get; }
    DbSet<Wishlist> Wishlists { get; }
    DbSet<ProductVariant> ProductVariants { get; }
    DbSet<SellerEarning> SellerEarnings { get; }
    DatabaseFacade Database { get; }

    DbSet<TEntity> Set<TEntity>() where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
