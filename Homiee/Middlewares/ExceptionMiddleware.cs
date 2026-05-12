namespace Homiee.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                // Error handled by middleware
                context.Response.StatusCode = 500;
                
                var message = ex.Message;
                if (message.Contains("ResourceNotFound")) 
                    message = "Azure Storage Resource not found. Please verify container 'homieeimages' exists in the portal.";

                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    message = message
                });
            }
        }
    }
}
