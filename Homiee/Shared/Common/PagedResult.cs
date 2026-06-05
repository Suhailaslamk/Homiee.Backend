namespace Homiee.Shared.Common
{
    public class PagedResult<T> 
    {
        
        public int StatusCode { get; set; }
        public string Message { get; set; }
        public List<T> Data { get; set; } = new();
            public int TotalCount { get; set; }
            public int Page { get; set; }
            public int PageSize { get; set; }
        public PagedResult() { }
        public PagedResult(int statusCode, string message, List<T> data, int totalCount, int page, int pageSize)
        {
            StatusCode = statusCode;
            Message = message;
            Data = data;
            TotalCount = totalCount;
            Page = page;
            PageSize = pageSize;
        }

    }
}
