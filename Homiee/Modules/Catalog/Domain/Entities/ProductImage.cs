using Homiee.Shared.Domain.Entities;

namespace Homiee.Modules.Catalog.Domain.Entities
{
    public class ProductImage : BaseEntity
    {
        public int ProductId { get; set; }
        public Product Product { get; set; }

        public string ImageUrl { get; set; }
        public bool IsPrimary { get; set; }
    }
}
