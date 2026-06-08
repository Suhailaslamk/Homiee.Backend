using Homiee.Modules.AiImage.Domain.Enums;

namespace Homiee.Modules.AiImage.Application.Dtos
{
    /// <summary>Request body to start a generation job.</summary>
    public class StartGenerationDto
    {
        public string Prompt { get; set; } = string.Empty;
    }

    /// <summary>Response when a generation job is started.</summary>
    public class StartGenerationResponseDto
    {
        public int RequestId { get; set; }
        public string Status { get; set; } = string.Empty;
        public bool CacheHit { get; set; }
    }

    /// <summary>Polling response — status + optional image URLs.</summary>
    public class GenerationStatusDto
    {
        public int RequestId { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = new();
        public string? FailureReason { get; set; }
        public int RetryCount { get; set; }
    }

    /// <summary>Request body when the user selects a generated image to attach to a product.</summary>
    public class SelectAiImageDto
    {
        public int RequestId { get; set; }

        // The blob URL of the generated image the user selected
        public string SelectedImageUrl { get; set; } = string.Empty;

        // Target product to attach the image to (optional — may be null during creation draft)
        public int? ProductId { get; set; }
    }

    /// <summary>Response when a user selects an image — returns the final blob URL.</summary>
    public class SelectAiImageResponseDto
    {
        public string BlobUrl { get; set; } = string.Empty;
    }
}