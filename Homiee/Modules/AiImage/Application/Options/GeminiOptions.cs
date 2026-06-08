namespace Homiee.Modules.AiImage.Application.Options
{
    public class GeminiOptions
    {
        public string ApiKey { get; set; } = string.Empty;

        // Gemini image generation model. Imagen models require a paid plan.
        public string ModelName { get; set; } =
            "gemini-2.5-flash-image";

        public string BaseUrl { get; set; } =
            "https://generativelanguage.googleapis.com/v1beta";

        public int TimeoutSeconds { get; set; } = 60;

        public int SampleCount { get; set; } = 1;
    }
}
