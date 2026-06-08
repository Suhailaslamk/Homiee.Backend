namespace Homiee.Modules.AiImage.Application.IServices
{
    /// <summary>
    /// Abstraction over the Gemini Imagen API.
    /// Returns raw image bytes per generated image.
    /// </summary>
    public interface IGeminiService
    {
        /// <summary>
        /// Calls Gemini Imagen and returns a list of image byte arrays.
        /// Throws GeminiException on API errors.
        /// </summary>
        Task<List<byte[]>> GenerateImagesAsync(string prompt, CancellationToken cancellationToken = default);
    }
}