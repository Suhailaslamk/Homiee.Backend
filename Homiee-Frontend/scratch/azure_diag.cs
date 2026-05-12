using Azure.Storage.Blobs;
using Microsoft.Extensions.Configuration;
using System;
using System.Threading.Tasks;

public class AzureDiagnostics
{
    public static async Task ListContainers(string connectionString)
    {
        try
        {
            var serviceClient = new BlobServiceClient(connectionString);
            Console.WriteLine("Listing containers for account: " + serviceClient.AccountName);
            await foreach (var container in serviceClient.GetBlobContainersAsync())
            {
                Console.WriteLine("- " + container.Name);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error listing containers: " + ex.Message);
        }
    }
}
