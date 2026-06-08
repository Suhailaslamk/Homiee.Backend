using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.Extensions.Configuration;

namespace Homiee.Shared.Infrastructure.Storage
{
    /// <summary>
    /// Extends the existing AzureBlobService with a byte[] upload overload.
    /// Used by the AI image feature to upload Gemini-generated images
    /// using exactly the same container and naming convention as the
    /// existing IFileStorageService.UploadAsync(IFormFile, folder) flow.
    /// </summary>
    public class AzureBlobByteUploader
    {
        private readonly BlobContainerClient _container;

        public AzureBlobByteUploader(IConfiguration config)
        {
            var connectionString = config["AzureBlob:ConnectionString"];
            var containerName = config["AzureBlob:ContainerName"];

            if (string.IsNullOrWhiteSpace(connectionString))
                throw new ArgumentNullException(nameof(connectionString));
            if (string.IsNullOrWhiteSpace(containerName))
                throw new ArgumentNullException(nameof(containerName));

            var client = new BlobServiceClient(connectionString);
            _container = client.GetBlobContainerClient(containerName);
        }

        /// <summary>
        /// Uploads raw image bytes to Azure Blob Storage.
        /// Follows the same folder/naming strategy as AzureBlobService.UploadAsync.
        /// Returns the public URL.
        /// </summary>
        public async Task<string> UploadBytesAsync(
            byte[] imageBytes,
            string folder,
            string contentType = "image/png")
        {
            if (imageBytes == null || imageBytes.Length == 0)
                throw new ArgumentException("Image bytes cannot be empty.");

            await _container.CreateIfNotExistsAsync(PublicAccessType.Blob);

            var safeFolder = folder.Trim().Trim('/');
            var extension = contentType == "image/jpeg" ? ".jpg" : ".png";
            var fileName = $"{Guid.NewGuid()}{extension}";
            var blobPath = $"{safeFolder}/{fileName}";

            var blobClient = _container.GetBlobClient(blobPath);

            var blobHttpHeader = new BlobHttpHeaders
            {
                ContentType = contentType
            };

            using var stream = new MemoryStream(imageBytes);
            await blobClient.UploadAsync(stream, new BlobUploadOptions
            {
                HttpHeaders = blobHttpHeader
            });

            return blobClient.Uri.GetLeftPart(UriPartial.Path);
        }
    }
}