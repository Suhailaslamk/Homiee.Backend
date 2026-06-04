using FluentAssertions;
using Microsoft.Playwright;
using System.Text.RegularExpressions;
using Xunit.Abstractions;

namespace Homiee.Tests.E2E;

public class PublicNavigationE2ETests : E2ETestBase
{
    public PublicNavigationE2ETests(PlaywrightFixture fixture, ITestOutputHelper output)
        : base(fixture, output)
    {
    }

    [Fact]
    public async Task Home_ShouldNavigateToDiscovery()
    {
        var page = await NewPageOrSkipAsync();
        if (page is null) return;

        await DismissSplashIfPresentAsync(page);
        await page.GotoAsync("/");

        await page.GetByRole(AriaRole.Button, new() { NameRegex = new("Shop Local", RegexOptions.IgnoreCase) }).ClickAsync();

        await page.WaitForURLAsync("**/discovery");
        page.Url.Should().Contain("/discovery");
        await page.GetByText("Curated", new() { Exact = false }).WaitForAsync();
    }

    [Fact]
    public async Task Login_ShouldShowValidationErrors_WhenSubmittedEmpty()
    {
        var page = await NewPageOrSkipAsync();
        if (page is null) return;

        await DismissSplashIfPresentAsync(page);
        await page.GotoAsync("/login");

        await page.GetByRole(AriaRole.Button, new() { NameRegex = new("Enter Homiee", RegexOptions.IgnoreCase) }).ClickAsync();

        await page.GetByText("Email is required", new() { Exact = false }).WaitForAsync();
        await page.GetByText("Password is required", new() { Exact = false }).WaitForAsync();
    }

    [Fact]
    public async Task CustomerSignup_ShouldShowValidationErrors_WhenSubmittedEmpty()
    {
        var page = await NewPageOrSkipAsync();
        if (page is null) return;

        await DismissSplashIfPresentAsync(page);
        await page.GotoAsync("/signup/customer");

        await page.GetByRole(AriaRole.Button, new() { NameRegex = new("Create Account", RegexOptions.IgnoreCase) }).ClickAsync();

        await page.GetByText("Full name is required", new() { Exact = false }).WaitForAsync();
        await page.GetByText("Email is required", new() { Exact = false }).WaitForAsync();
        await page.GetByText("Password is required", new() { Exact = false }).WaitForAsync();
    }
}
