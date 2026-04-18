namespace Homiee.Common
{
    public class ApiResponse<T>

    {
        public bool IsSuccess { get; set; }
        public int StatusCode { get; set; }
        public string Message { get; set; } = string.Empty;

        public T? Data { get; set; }

        public int TotalCount { get; set; }
        public int CurrentPage { get; set; }

        public int PageSize { get; set; }

        public ApiResponse( int statusCode, string message, T? data = default, int totalcount = 0, int currentpage = 1, int pagesize = 10)
        {
            StatusCode = statusCode;
            Message = message;
            Data = data;
            IsSuccess = statusCode >= 200 && statusCode < 300;
            TotalCount = totalcount;
            CurrentPage = currentpage;
            PageSize = pagesize;



        }
        

    }
}
