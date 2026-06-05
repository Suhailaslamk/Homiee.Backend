namespace Homiee.Shared.Applications.IServices
{
    public interface IFileStorageService
    {
        Task<string> UploadAsync(IFormFile file, string folder);
        Task<bool> DeleteAsync(
        string fileUrl);
    }
}
