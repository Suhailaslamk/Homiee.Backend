namespace Homiee.Application.Interfaces.IServices
{
    public interface IFileStorageService
    {
        Task<string> UploadAsync(IFormFile file, string folder);
    }
}
