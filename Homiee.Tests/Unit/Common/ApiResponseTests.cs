using FluentAssertions;
using Homiee.Shared.Common;

namespace Homiee.Tests.Unit.Common;

public class ApiResponseTests
{
    [Theory]
    [InlineData(200, true)]
    [InlineData(201, true)]
    [InlineData(299, true)]
    [InlineData(300, false)]
    [InlineData(400, false)]
    [InlineData(500, false)]
    public void Constructor_ShouldSetSuccess_FromStatusCode(int statusCode, bool expectedSuccess)
    {
        var response = new ApiResponse<string>(statusCode, "Result", "payload");

        response.IsSuccess.Should().Be(expectedSuccess);
        response.StatusCode.Should().Be(statusCode);
        response.Message.Should().Be("Result");
        response.Data.Should().Be("payload");
    }

    [Fact]
    public void Constructor_ShouldKeepPaginationMetadata()
    {
        var response = new ApiResponse<IReadOnlyList<int>>(
            200,
            "Paged result",
            [1, 2, 3],
            totalcount: 25,
            currentpage: 2,
            pagesize: 10);

        response.TotalCount.Should().Be(25);
        response.CurrentPage.Should().Be(2);
        response.PageSize.Should().Be(10);
    }
}
