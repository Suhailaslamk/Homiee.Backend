using FluentAssertions;
using Homiee.Modules.Catalog.Application.Helpers;

namespace Homiee.Tests.Unit.Services;

public class GeoHelperTests
{
    [Fact]
    public void DistanceKm_ShouldReturnZero_ForSamePoint()
    {
        var distance = GeoHelper.DistanceKm(10.123, 76.456, 10.123, 76.456);

        distance.Should().BeApproximately(0, 0.0001);
    }

    [Fact]
    public void DistanceKm_ShouldCalculateKnownDistance()
    {
        var distance = GeoHelper.DistanceKm(10.8505, 76.2711, 12.9716, 77.5946);

        distance.Should().BeApproximately(276, 5);
    }

    [Fact]
    public void BoundingBox_ShouldContainCenterPoint()
    {
        var box = GeoHelper.BoundingBox(10.8505, 76.2711, 25);

        box.MinLat.Should().BeLessThan(10.8505);
        box.MaxLat.Should().BeGreaterThan(10.8505);
        box.MinLon.Should().BeLessThan(76.2711);
        box.MaxLon.Should().BeGreaterThan(76.2711);
    }
}
