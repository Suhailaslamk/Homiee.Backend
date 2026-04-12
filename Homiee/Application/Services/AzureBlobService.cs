using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Blobs.Specialized;
using Azure.Storage.Sas;
using Homiee.Application.Interfaces.IServices;
namespace Homiee.Application.Services
{

    public class AzureBlobService : IFileStorageService
    {
        private readonly BlobContainerClient _container;

        public AzureBlobService(IConfiguration config)
        {
            var connectionString = config["AzureBlob:ConnectionString"];

            if (string.IsNullOrWhiteSpace(connectionString))
                throw new Exception("Azure Blob connection string is missing");

            var containerName = config["AzureBlob:ContainerName"];

            var client = new BlobServiceClient(connectionString);
            _container = client.GetBlobContainerClient(containerName);
        }

        public async Task<string> UploadAsync(IFormFile file, string folder)
        {
            var fileName = $"{folder}/{Guid.NewGuid()}_{file.FileName}";
            var blobClient = _container.GetBlobClient(fileName);

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, new BlobHttpHeaders { ContentType = file.ContentType });

            // --- Start SAS Generation ---
            if (blobClient.CanGenerateSasUri)
            {
                BlobSasBuilder sasBuilder = new BlobSasBuilder()
                {
                    BlobContainerName = blobClient.GetParentBlobContainerClient().Name,
                    BlobName = blobClient.Name,
                    Resource = "b", // "b" stands for blob
                    ExpiresOn = DateTimeOffset.UtcNow.AddHours(1) // Link expires in 1 hour
                };

                // Specify Read permissions
                sasBuilder.SetPermissions(BlobSasPermissions.Read);

                Uri sasUri = blobClient.GenerateSasUri(sasBuilder);
                return sasUri.ToString(); // This URL now contains the ?sv=... token
            }

            return blobClient.Uri.ToString();
        }
    }
}