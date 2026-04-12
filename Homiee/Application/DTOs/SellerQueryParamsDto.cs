namespace Homiee.Application.DTOs
{
    public class SellerQueryParamsDto
    {
       
            public string? Status { get; set; }
            public string? Search { get; set; } // name, email, GST
            public string? SortBy { get; set; } // name, createdAt
            public bool Desc { get; set; } = false;

            public int Page { get; set; } = 1;
            public int PageSize { get; set; } = 10;
        
    }
}
