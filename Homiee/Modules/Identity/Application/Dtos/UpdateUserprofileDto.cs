namespace Homiee.Modules.Identity.Application.Dtos
{
    public class UpdateUserprofileDto
    {
        public string? Name { get; set; }
        public IFormFile? ProfilePicture { get; set; }
    }
}
