using FluentAssertions;
using Microsoft.Playwright;
using Xunit.Abstractions;

namespace Homiee.Tests.E2E;

public class ProductDetailsE2ETests : E2ETestBase
{
    public ProductDetailsE2ETests(PlaywrightFixture fixture, ITestOutputHelper output)
        : base(fixture, output)
    {
    }

    [Fact]
    public async Task ProductDetails_ShouldRenderRecommendationImages_WhenRecommendationsExist()
    {
        var page = await NewPageOrSkipAsync();
        if (page is null) return;

        await DismissSplashIfPresentAsync(page);
        await page.GotoAsync("/discovery");
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var firstProduct = page.Locator("a[href^='/product/'], a[href*='/product/']").First;
        if (await firstProduct.CountAsync() == 0)
        {
            return;
        }

        await firstProduct.ClickAsync();
        await page.WaitForURLAsync("**/product/**");
        await page.WaitForLoadStateAsync(LoadState.NetworkIdle);

        var recommendationSection = page.GetByText("Perfect", new() { Exact = false }).First;
        await recommendationSection.WaitForAsync();

        var recommendationImages = page.Locator("a[href^='/product/'] img, a[href*='/product/'] img");
        var count = await recommendationImages.CountAsync();
        if (count <= 1)
        {
            return;
        }

        var loadedImages = await recommendationImages.EvaluateAllAsync<int>(
            "imgs => imgs.filter(img => img.complete && img.naturalWidth > 0 && img.currentSrc).length");

        loadedImages.Should().BeGreaterThan(1, "product details recommendations should display real loaded images");
    }
}
