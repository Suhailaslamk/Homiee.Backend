using Microsoft.Playwright;
using Xunit.Abstractions;

namespace Homiee.Tests.E2E;

public abstract class E2ETestBase : IClassFixture<PlaywrightFixture>
{
    private readonly PlaywrightFixture _fixture;
    private readonly ITestOutputHelper _output;

    protected E2ETestBase(PlaywrightFixture fixture, ITestOutputHelper output)
    {
        _fixture = fixture;
        _output = output;
    }

    protected async Task<IPage?> NewPageOrSkipAsync()
    {
        if (!E2EConfig.IsConfigured)
        {
            var message = "E2E tests were not run because HOMIEE_E2E_BASE_URL is not set.";
            if (E2EConfig.RequireConfigured)
            {
                throw new InvalidOperationException(message);
            }

            _output.WriteLine(message);
            return null;
        }

        if (!_fixture.IsAvailable)
        {
            throw new InvalidOperationException("Playwright browser is unavailable. Run: pwsh bin/Debug/net8.0/playwright.ps1 install");
        }

        return await _fixture.NewPageAsync();
    }

    protected static async Task DismissSplashIfPresentAsync(IPage page)
    {
        await page.EvaluateAsync("() => sessionStorage.setItem('hasSeenSplash', 'true')");
    }
}
