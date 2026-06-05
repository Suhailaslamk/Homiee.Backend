namespace Homiee.Modules.Catalog.Application.Dtos
{
    public class AddProductImagesDto
    {
        public List<IFormFile> Images { get; set; } = new();
    }
}
