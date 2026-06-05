using Homiee.Modules.Catalog.Domain.Entities;
using Homiee.Shared.Domain.Entities;

namespace Homiee.Modules.Orders.Domain.Entities
{
    public class OrderItem : BaseEntity
    {

        public int OrderId { get; private set; }
        public string ProductName { get; private set; }
        public int ProductId { get; private set; }

        public int SellerId { get; private set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; }
        public int? ProductVariantId { get; private set; }
        public string? VariantLabel { get; private set; }

        public Order Order { get; set; }
        public Product Product { get; set; }

        private OrderItem() { }

        public OrderItem(int productId, int sellerId, int quantity, decimal price, string productName, int? productVariantId = null, string? variantLabel = null)
        {
            ProductId = productId;
            SellerId = sellerId;
            Quantity = quantity;
            Price = price;
            ProductName = productName;
            ProductVariantId = productVariantId;
            VariantLabel = variantLabel;
        }
    }
    }
