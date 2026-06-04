using Microsoft.Playwright;

namespace Homiee.Tests.E2E;

public sealed class PlaywrightFixture : IAsyncLifetime
{
    private IPlaywright? _playwright;
    private IBrowser? _browser;

    public bool IsAvailable => _browser is not null;

    public async Task InitializeAsync()
    {
        if (!E2EConfig.IsConfigured)
        {
            return;
        }

        _playwright = await Playwright.CreateAsync();

        var browserType = E2EConfig.BrowserName switch
        {
            "firefox" => _playwright.Firefox,
            "webkit" => _playwright.Webkit,
            _ => _playwright.Chromium
        };

        _browser = await browserType.LaunchAsync(new BrowserTypeLaunchOptions
        {
            Headless = E2EConfig.Headless
        });
    }

    public async Task<IPage?> NewPageAsync()
    {
        if (_browser is null)
        {
            return null;
        }

        var context = await _browser.NewContextAsync(new BrowserNewContextOptions
        {
            BaseURL = E2EConfig.BaseUrl,
            ViewportSize = new ViewportSize
            {
                Width = 1440,
                Height = 1000
            }
        });

        return await context.NewPageAsync();
    }

    public async Task DisposeAsync()
    {
        if (_browser is not null)
        {
            await _browser.DisposeAsync();
        }

        _playwright?.Dispose();
    }
}
