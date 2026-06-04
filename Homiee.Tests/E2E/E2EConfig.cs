namespace Homiee.Tests.E2E;

public static class E2EConfig
{
    public static string? BaseUrl => NormalizeUrl(Environment.GetEnvironmentVariable("HOMIEE_E2E_BASE_URL"));

    public static bool RequireConfigured =>
        string.Equals(Environment.GetEnvironmentVariable("HOMIEE_E2E_REQUIRE"), "true", StringComparison.OrdinalIgnoreCase);

    public static bool IsConfigured => !string.IsNullOrWhiteSpace(BaseUrl);

    public static string BrowserName =>
        Environment.GetEnvironmentVariable("HOMIEE_E2E_BROWSER")?.Trim().ToLowerInvariant() switch
        {
            "firefox" => "firefox",
            "webkit" => "webkit",
            _ => "chromium"
        };

    public static bool Headless =>
        !string.Equals(Environment.GetEnvironmentVariable("HOMIEE_E2E_HEADLESS"), "false", StringComparison.OrdinalIgnoreCase);

    private static string? NormalizeUrl(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().TrimEnd('/');
    }
}
