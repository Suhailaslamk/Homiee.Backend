using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Homiee.Shared.Applications.IServices;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Homiee.Shared.Infrastructure.Storage
{
    public class AzureBlobService : IFileStorageService
    {
        private readonly BlobContainerClient _container;

        public AzureBlobService(IConfiguration config)
        {
            var connectionString = config["AzureBlob:ConnectionString"];
            var containerName = config["AzureBlob:ContainerName"];

            if (string.IsNullOrWhiteSpace(connectionString))
                throw new ArgumentNullException(nameof(connectionString), "Azure Blob connection string is missing");

            if (string.IsNullOrWhiteSpace(containerName))
                throw new ArgumentNullException(nameof(containerName), "Azure Blob container name is missing");

            var client = new BlobServiceClient(connectionString);
            _container = client.GetBlobContainerClient(containerName);
        }

        public async Task<string> UploadAsync(IFormFile file, string folder)
        {
            try
            {
                if (file == null || file.Length == 0)
                    throw new ArgumentException("File is empty");

                if (string.IsNullOrWhiteSpace(folder))
                    throw new ArgumentException("Folder name is required");

                await _container.CreateIfNotExistsAsync(PublicAccessType.Blob);

                var safeFolder = folder.Trim().Trim('/');
                var extension = Path.GetExtension(file.FileName).ToLower();
                var fileName = $"{Guid.NewGuid()}{extension}";
                var blobPath = $"{safeFolder}/{fileName}";

                var blobClient = _container.GetBlobClient(blobPath);
                var blobHttpHeader = new BlobHttpHeaders
                {
                    ContentType = file.ContentType
                };

                using (var stream = file.OpenReadStream())
                {
                    await blobClient.UploadAsync(stream, new BlobUploadOptions
                    {
                        HttpHeaders = blobHttpHeader
                    });
                }

                return blobClient.Uri.GetLeftPart(UriPartial.Path);
            }
            catch (Exception ex)
            {
                throw new Exception($"[AzureStorageError] Path: {_container.Name}/{folder}. Message: {ex.Message}", ex);
            }
        }

        public async Task<bool> DeleteAsync(string fileUrl)
        {
            if (string.IsNullOrEmpty(fileUrl)) return false;

            try
            {
                Uri uri = new Uri(fileUrl);
                string blobName = uri.AbsolutePath.Replace($"/{_container.Name}/", "");
                var blobClient = _container.GetBlobClient(blobName);
                return await blobClient.DeleteIfExistsAsync();
            }
            catch
            {
                return false;
            }
        }
    }
}
