using FluentAssertions;
using Homiee.Shared.Common;

namespace Homiee.Tests.Unit.Common;

public class PagedResultTests
{
    [Fact]
    public void Constructor_ShouldAssignValues()
    {
        var items = new List<string> { "first", "second" };

        var result = new PagedResult<string>(
            200,
            "Products loaded",
            items,
            totalCount: 12,
            page: 2,
            pageSize: 5);

        result.StatusCode.Should().Be(200);
        result.Message.Should().Be("Products loaded");
        result.Data.Should().BeEquivalentTo(items);
        result.TotalCount.Should().Be(12);
        result.Page.Should().Be(2);
        result.PageSize.Should().Be(5);
    }
}
