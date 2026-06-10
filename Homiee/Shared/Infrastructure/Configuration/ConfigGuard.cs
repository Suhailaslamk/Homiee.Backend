namespace Homiee.Shared.Infrastructure.Configuration;

public static class ConfigGuard
{
    public static string GetRequired(IConfiguration config, string key)
    {
        var value = config[key];

        if (string.IsNullOrWhiteSpace(value))
            throw new Exception($"❌ Missing required configuration: {key}");

        return value;
    }

    public static string? GetOptional(IConfiguration config, string key)
    {
        var value = config[key];
        return string.IsNullOrWhiteSpace(value) ? null : value;
    }
}