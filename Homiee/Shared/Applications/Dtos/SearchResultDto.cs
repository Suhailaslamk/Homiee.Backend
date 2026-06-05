using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Modules.Identity.Application.Dtos;

namespace Homiee.Shared.Applications.Dtos
{
    public class SearchResultDto
    {
        public List<ProductListDto> Products { get; set; }
        public List<SellerListDto> Sellers { get; set; }
    }
}
