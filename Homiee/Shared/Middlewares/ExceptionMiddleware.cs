using Microsoft.Data.SqlClient;
using Sentry;
namespace Homiee.Shared.Middlewares
{
    public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IWebHostEnvironment _environment;

        public ExceptionMiddleware(
            RequestDelegate next,
            ILogger<ExceptionMiddleware> logger,
            IWebHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task Invoke(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                SentrySdk.CaptureException(ex);
                _logger.LogError(ex,
                    "Unhandled exception occurred.");

                context.Response.ContentType =
                    "application/json";

                context.Response.StatusCode =
                    StatusCodes.Status500InternalServerError;

                string message =
                    "Something went wrong. Please try again later.";

                // Safe custom messages
                if (ex.Message.Contains("ResourceNotFound"))
                {
                    message =
                        "File storage is temporarily unavailable.";
                }

                // Development only → show real error
                if (_environment.IsDevelopment())
                {
                    message = ex.Message;
                }

                await context.Response.WriteAsJsonAsync(new
                {
                    success = false,
                    message
                });
            }
        }
    }
}