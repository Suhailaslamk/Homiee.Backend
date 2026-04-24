//using Azure.Storage.Blobs;
//using Azure.Storage.Blobs.Models;
//using Azure.Storage.Blobs.Specialized;
//using Azure.Storage.Sas;
//using Homiee.Application.Interfaces.IServices;
//namespace Homiee.Application.Services
//{

//    public class AzureBlobService : IFileStorageService
//    {
//        private readonly BlobContainerClient _container;

//        public AzureBlobService(IConfiguration config)
//        {
//            var connectionString = config["AzureBlob:ConnectionString"];

//            if (string.IsNullOrWhiteSpace(connectionString))
//                throw new Exception("Azure Blob connection string is missing");

//            var containerName = config["AzureBlob:ContainerName"];

//            var client = new BlobServiceClient(connectionString);
//            _container = client.GetBlobContainerClient(containerName);
//        }

//        public async Task<string> UploadAsync(IFormFile file, string folder)
//        {
//            await _container.CreateIfNotExistsAsync();

//            var cleanFileName = Path.GetFileName(file.FileName); // avoid weird paths
//            var fileName = $"{folder}/{Guid.NewGuid()}_{cleanFileName}";

//            var blobClient = _container.GetBlobClient(fileName);

//            using var stream = file.OpenReadStream();
//            await blobClient.UploadAsync(stream, new BlobHttpHeaders
//            {
//                ContentType = file.ContentType
//            });

//            return blobClient.Uri.ToString(); // ✅ simple public URL
//        }


//    }
//}

using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Homiee.Application.Services
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

            // Note: Since you manually changed access to 'Blob' in the portal, 
            // this line will ensure the container exists but won't overwrite your portal settings.
            _container.CreateIfNotExists(PublicAccessType.Blob);
        }

        public async Task<string> UploadAsync(IFormFile file, string folder)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("File is empty");

            if (string.IsNullOrWhiteSpace(folder))
                throw new ArgumentException("Folder name is required");

            // 1. Clean folder and filename
            var safeFolder = folder.Trim().Trim('/');
            var extension = Path.GetExtension(file.FileName).ToLower();

            // 2. Generate a clean, unique name (Guid + Extension)
            // Using just the Guid + Extension is safer than keeping original filenames which might have special characters
            var fileName = $"{Guid.NewGuid()}{extension}";
            var blobPath = $"{safeFolder}/{fileName}";

            var blobClient = _container.GetBlobClient(blobPath);

            // 3. Set proper headers so the browser renders the image instead of downloading it
            var blobHttpHeader = new BlobHttpHeaders
            {
                ContentType = file.ContentType
            };

            // 4. Upload using the modern BlobUploadOptions
            using (var stream = file.OpenReadStream())
            {
                await blobClient.UploadAsync(stream, new BlobUploadOptions
                {
                    HttpHeaders = blobHttpHeader
                });
            }

            // 5. Return the direct URL (Works because you set access to 'Blob')
            return  blobClient.Uri.GetLeftPart(UriPartial.Path); 
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