using System.Text;
using System.Text.Json;
using Homiee.Modules.AiImage.Application.IServices;
using Homiee.Modules.AiImage.Application.Options;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Polly;
using Polly.Retry;

namespace Homiee.Modules.AiImage.Application.Services
{
    
    public class GeminiService : IGeminiService
    {
        private readonly HttpClient _httpClient;
        private readonly GeminiOptions _options;
        private readonly ILogger<GeminiService> _logger;
        private readonly AsyncRetryPolicy _retryPolicy;

        public GeminiService(
            HttpClient httpClient,
            IOptions<GeminiOptions> options,
            ILogger<GeminiService> logger)
        {
            _httpClient = httpClient;
            _options = options.Value;
            _logger = logger;

            // Polly: retry on transient HTTP errors (5xx, network errors)
            // Delay: 2s, 4s
            _retryPolicy = Policy
                .Handle<HttpRequestException>()
                .Or<TaskCanceledException>()
                .WaitAndRetryAsync(
                    retryCount: 2,
                    sleepDurationProvider: attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)),
                    onRetry: (ex, duration, attempt, _) =>
                    {
                        _logger.LogWarning(
                            "Gemini API transient error on attempt {Attempt}. Retrying in {Delay}s. Error: {Error}",
                            attempt, duration.TotalSeconds, ex.Message);
                    });
        }

        public async Task<List<byte[]>> GenerateImagesAsync(
    string prompt,
    CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(_options.ApiKey))
            {
                throw new GeminiException(
                    "Gemini API key is not configured. Set Gemini:ApiKey or Gemini__ApiKey before generating images.",
                    500);
            }

            if (string.IsNullOrWhiteSpace(_options.ModelName))
            {
                throw new GeminiException(
                    "Gemini model name is not configured.",
                    500);
            }

            var baseUrl = _options.BaseUrl.TrimEnd('/');
            var url =
                $"{baseUrl}/models/{_options.ModelName}:generateContent";

            var requestBody = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new
                            {
                                text = prompt
                            }
                        }
                    }
                },
                generationConfig = new
                {
                    responseModalities = new[] { "TEXT", "IMAGE" }
                }
            };

            var json = JsonSerializer.Serialize(requestBody);



            _logger.LogInformation(
                "Gemini Request URL: {Url}",
                url);

            _logger.LogInformation(
                "Gemini Request Body: {Body}",
                json);

            HttpResponseMessage response = null!;

            await _retryPolicy.ExecuteAsync(async () =>
            {
                using var retryCts =
                    CancellationTokenSource.CreateLinkedTokenSource(
                        cancellationToken);

                retryCts.CancelAfter(
                    TimeSpan.FromSeconds(_options.TimeoutSeconds));

                using var retryContent =
                    new StringContent(
                        json,
                        Encoding.UTF8,
                        "application/json");

                using var request = new HttpRequestMessage(
                    HttpMethod.Post,
                    url);

                request.Headers.Add("x-goog-api-key", _options.ApiKey.Trim());
                request.Content = retryContent;

                response = await _httpClient.SendAsync(
                    request,
                    retryCts.Token);
            });

            var responseBody =
                await response.Content.ReadAsStringAsync(cancellationToken);

            _logger.LogInformation(
                "Gemini Raw Response: {Response}",
                responseBody);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError(
                    "Gemini API error. Status={Status}, Body={Body}",
                    (int)response.StatusCode,
                    responseBody);

                throw new GeminiException(
                    TryExtractGeminiError(responseBody)
                    ?? $"Gemini API returned {(int)response.StatusCode}",
                    (int)response.StatusCode);
            }

            using var doc = JsonDocument.Parse(responseBody);

            if (!doc.RootElement.TryGetProperty(
                    "candidates",
                    out var candidates))
            {
                throw new GeminiException(
                    $"Unexpected Gemini response: {responseBody}",
                    500);
            }

            var imageBytes = new List<byte[]>();

            foreach (var candidate in candidates.EnumerateArray())
            {
                if (!candidate.TryGetProperty("content", out var content)
                    || !content.TryGetProperty("parts", out var parts))
                {
                    continue;
                }

                foreach (var part in parts.EnumerateArray())
                {
                    if (!part.TryGetProperty("inlineData", out var inlineData)
                        || !inlineData.TryGetProperty("data", out var dataEl))
                    {
                        continue;
                    }

                    var base64 = dataEl.GetString();

                    if (!string.IsNullOrWhiteSpace(base64))
                    {
                        imageBytes.Add(Convert.FromBase64String(base64));
                    }
                }
            }

            if (imageBytes.Count == 0)
            {
                throw new GeminiSafetyException(
                    "No images returned.");
            }

            return imageBytes;
        }

        private static string? TryExtractGeminiError(string body)
        {
            try
            {
                using var doc = JsonDocument.Parse(body);
                if (doc.RootElement.TryGetProperty("error", out var error)
                    && error.TryGetProperty("message", out var msg))
                    return msg.GetString();
            }
            catch { /* ignore */ }
            return null;
        }
    }

    public class GeminiException : Exception
    {
        public int StatusCode { get; }
        public GeminiException(string message, int statusCode) : base(message)
        {
            StatusCode = statusCode;
        }
    }

    public class GeminiSafetyException : GeminiException
    {
        public GeminiSafetyException(string message) : base(message, 422) { }
    }
}
