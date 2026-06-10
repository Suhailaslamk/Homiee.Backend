using Homiee.Presentation.Hubs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using System.Diagnostics.CodeAnalysis;
using System.Security.Cryptography;
using Homiee.Modules.AiImage.Application.IServices;
using Homiee.Modules.AiImage.Application.IRepository;
using Homiee.Modules.AiImage.Application.Options;
using Homiee.Modules.AiImage.Infrastructure.Repositories;
using Homiee.Modules.AiImage.Infrastructure.Jobs;
using Homiee.Modules.AiImage.Application.Services;
using Hangfire;
using Hangfire.SqlServer;
using Serilog;
using System.Text;
using Homiee.Modules.Identity.Application.Services;
using Homiee.Modules.Identity.Infrastructure.Repositories;
using Homiee.Modules.Catalog.Application.Services;
using Homiee.Modules.Catalog.Infrastructure.Repositories;
using Homiee.Modules.Orders.Application.Services;
using Homiee.Modules.Orders.Infrastructure.Repositories;
using Homiee.Modules.Cart.Application.Services;
using Homiee.Modules.Cart.Infrastructure.Repositories;
using Homiee.Modules.Reviews.Application.Services;
using Homiee.Modules.Reviews.Infrastructure.Repositories;
using Homiee.Modules.Notifications.Application.Services;
using Homiee.Modules.Notifications.Infrastructure.Repositories;
using Homiee.Modules.Notifications.Api.Hubs;
using Homiee.Modules.Notifications.Infrastructure.SignalR;
using Homiee.Modules.Analytics.Applications.Services;
using Homiee.Modules.Analytics.Applications.IServices;
using Homiee.Modules.Catalog.Application.IServices;
using Homiee.Modules.Cart.Application.IServices;
using Homiee.Modules.Orders.Application.IServices;
using Homiee.Modules.Identity.Application.IServices;
using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Modules.Catalog.Application.IRepository;
using Homiee.Modules.Notifications.Application.IServices;
using Homiee.Modules.Notifications.Application.IRepositories;
using Homiee.Modules.Cart.Application.IRepositories;
using Homiee.Modules.Orders.Application.IRepositories;
using Homiee.Modules.Reviews.Application.IRepositories;
using Homiee.Modules.Reviews.Application.IServices;
using Homiee.Shared.Infrastructure.BackgroundServices;
using Homiee.Shared.Infrastructure.Cache;
using Homiee.Shared.Infrastructure.Data;
using Homiee.Shared.Infrastructure.Storage;
using Homiee.Shared.Applications.IServices;
using Homiee.Shared.Applications.IData;
using Homiee.Shared.Applications.Options;
using Homiee.Shared.Providers;
using Homiee.Shared.Middlewares;
using Homiee.Shared.Infrastructure.Configuration;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

Log.Debug("init main");

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Services.AddSignalR();
    builder.Host.UseSerilog((context, services, configuration) =>
    {
        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext();
    });

static string? GetConn(IConfiguration config, string key)
{
    var value = config.GetConnectionString(key);
    return string.IsNullOrWhiteSpace(value) ? null : value;
}


builder.Services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<AppDbContext>());
builder.Services.Configure<CacheSettings>(
    builder.Configuration.GetSection("CacheSettings"));

// Redis & Cache Configuration
var redisConnectionString =
    builder.Configuration.GetConnectionString("Redis");

bool isRedisAvailable = false;

if (!string.IsNullOrWhiteSpace(redisConnectionString))
{
    try
    {
        var muxer = await ConnectionMultiplexer.ConnectAsync(redisConnectionString);

        await muxer.GetDatabase().PingAsync();

        builder.Services.AddSingleton<IConnectionMultiplexer>(muxer);
        builder.Services.AddStackExchangeRedisCache(o =>
        {
            o.Configuration = redisConnectionString;
        });

        builder.Services.AddSingleton<ICacheService, RedisCacheService>();

        isRedisAvailable = true;

        Log.Information("Redis connected");
    }
    catch
    {
        Log.Warning("Redis failed → memory cache fallback");

        builder.Services.AddMemoryCache();
        builder.Services.AddSingleton<ICacheService, InMemoryCacheService>();
    }
}
else
{
    Log.Warning("Redis not provided → memory cache");

    builder.Services.AddMemoryCache();
    builder.Services.AddSingleton<ICacheService, InMemoryCacheService>();
}

// Health check
var healthBuilder = builder.Services.AddHealthChecks()
    .AddDbContextCheck<AppDbContext>();

if (isRedisAvailable)
{
    healthBuilder.AddRedis(redisConnectionString!);
}
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(x => x.Value.Errors.Count > 0)
            .SelectMany(x => x.Value.Errors.Select(e => new
            {
                field = x.Key,
                message = e.ErrorMessage
            }))
            .ToList();

        var response = new
        {
            success = false,
            message = "Validation failed",
            errors
        };

        return new BadRequestObjectResult(response);
    };
});


   var sqlConnection =
    builder.Configuration.GetConnectionString("DefaultConnection");

if (!string.IsNullOrWhiteSpace(sqlConnection))
{
    builder.Services.AddDbContext<AppDbContext>(options =>
        options.UseSqlServer(sqlConnection));

    builder.Services.AddHangfire(config =>
        config.UseSqlServerStorage(sqlConnection));

    builder.Services.AddHangfireServer();

    Log.Information("Database + Hangfire enabled.");
}
else
{
    Log.Fatal("❌ DATABASE CONNECTION STRING MISSING — STOPPING APP");
    throw new Exception("Database connection required");
}
  


    builder.Services.AddAuthorization();
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    // ✅ THIS WAS MISSING — you deleted it when adding OnMessageReceived
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,

        ValidIssuer = builder.Configuration["JWT:Issuer"],
        ValidAudience = builder.Configuration["JWT:Audience"],
        RoleClaimType = System.Security.Claims.ClaimTypes.Role,

        IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["JWT:Key"]))
    };

    options.Events = new JwtBearerEvents
    {
        // ✅ For SignalR — WebSocket can't send Authorization header,
        // so token comes as ?access_token= query param
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;

            if (!string.IsNullOrEmpty(accessToken) &&
                (path.StartsWithSegments("/chatHub") ||
                 path.StartsWithSegments("/hubs/notification")))
            {
                context.Token = accessToken;
            }

            return Task.CompletedTask;
        },

        OnTokenValidated = async context =>
        {
            try 
            {
                var tokenHandler = context.SecurityToken as System.IdentityModel.Tokens.Jwt.JwtSecurityToken;
                var rawToken = tokenHandler?.RawData;

                if (string.IsNullOrEmpty(rawToken))
                {
                    var authHeader = context.HttpContext.Request.Headers["Authorization"].ToString();
                    if (string.IsNullOrEmpty(authHeader))
                    {
                        // If it's a SignalR request and we have no token, it might be the negotiate phase
                        // or a failed transport upgrade. 
                        return;
                    }
                    rawToken = authHeader.Replace("Bearer ", "").Trim();
                }

                using var sha256 = SHA256.Create();
                var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawToken));
                var hashedToken = Convert.ToBase64String(bytes);

                var repo = context.HttpContext.RequestServices.GetService<IRevokedAccessTokenRepository>();
                if (repo != null)
                {
                    var isRevoked = await repo.IsRevokedAsync(hashedToken);
                    if (isRevoked)
                    {
                        context.Fail("Token has been revoked");
                    }
                }
            }
            catch (Exception ex)
            {
                // Stability Patch: If revocation check fails (e.g. Redis timeout), 
                // we allow the connection to proceed to avoid persistent 401s.
                var logger = context.HttpContext.RequestServices.GetService<ILogger<Program>>();
                logger?.LogWarning(ex, "Token revocation check failed. Allowing connection for stability.");
            }
        }
    };
});

var allowedOrigins =
    builder.Configuration
           .GetSection("AllowedOrigins")
           .Get<string[]>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        if (allowedOrigins is not null &&
            allowedOrigins.Length > 0)
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});
builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter: Bearer YOUR_TOKEN"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            new string[] {}
        }
    });
});
builder.Services.Configure<RecommendationWeightsOptions>(
    builder.Configuration.GetSection(RecommendationWeightsOptions.SectionName));
builder.Services.Configure<GeminiOptions>(
    builder.Configuration.GetSection("Gemini"));


builder.Services.AddScoped<IRecommendationService, RecommendationService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<ITokenRepository, TokenRepository>();
builder.Services.AddScoped<ISellersRepository, SellersRepository>();
builder.Services.AddScoped<IFileStorageService, AzureBlobService>();
builder.Services.AddScoped<IDeliveryRepository, DeliveryRepository>();
builder.Services.AddScoped<IProfileService, ProfileService>();
builder.Services.AddScoped<ISellerOnboardingService, SellerOnboardingService>();
builder.Services.AddScoped<IAdminSellerService, AdminSellerService>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<IProductImageRepository, ProductImageRepository>();
builder.Services.AddScoped<ISellerProductService, SellerProductService>();
builder.Services.AddScoped<IAdminProductService, AdminProductService>();
builder.Services.AddScoped<IProductImageRepository, ProductImageRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IAdminCategoryService, AdminCategoryService>();
builder.Services.AddScoped<ICustomerOrderService, CustomerOrderService>();
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IAdminOrderService, AdminOrderService>();
builder.Services.AddScoped<ICartService, CartService>();
builder.Services.AddScoped<ICartRepository, CartRepository>();
builder.Services.AddScoped<IMarketplaceQueryService, MarketplaceQueryService>();
builder.Services.AddScoped<IPendingOrderRepository, PendingOrderRepository>();
builder.Services.AddScoped<IAddressRepository, AddressRepository>();
builder.Services.AddScoped<IAddressService, AddressService>();
builder.Services.AddScoped<IReviewRepository, ReviewRepository>();
builder.Services.AddScoped<IReviewService, ReviewService>();
builder.Services.AddSingleton<IDbConnectionFactory, DapperContext>();
builder.Services.AddScoped<IAdminCustomerService, AdminCustomerService>();
builder.Services.AddScoped<ISellerOrderService, SellerOrderService>();
builder.Services.AddScoped<ISellerReviewService, SellerReviewService>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<ISellerEarningService, SellerEarningService>();
builder.Services.AddScoped<IAdminAnalyticsService, AdminAnalyticsService>();
builder.Services.AddScoped<ISellerAnalyticsService, SellerAnalyticsService>();
builder.Services.AddScoped<IWishlistRepository, WishlistRepository>();
builder.Services.AddScoped<IWishlistService, WishlistService>();
builder.Services.AddScoped<IAiImageGenerationService, AiImageGenerationService>();
builder.Services.AddScoped<IAiGenerationRepository, AiGenerationRepository>();
builder.Services.AddScoped<IAiImageRateLimitService, AiImageRateLimitService>();
builder.Services.AddScoped<AiImageGenerationJob>();
    builder.Services.AddScoped<AzureBlobByteUploader>();
    builder.Services.AddHttpClient<IGeminiService, GeminiService>(client =>
    {
        client.Timeout = TimeSpan.FromMinutes(2);
    });


    //builder.Services.Scan(scan => scan
    //.FromAssemblyOf<SellerOrderService>() 
    //.AddClasses()
    //.AsMatchingInterface()
    //.WithScopedLifetime());


    // SignalR already initialized in stability patch above

    builder.Services.AddSingleton<IUserIdProvider, CustomUserIdProvider>();
builder.Services.AddScoped<IChatRepository, ChatRepository>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<INotificationRepository, NotificationRepository>();
builder.Services.AddScoped<INotificationService, NotificationService>();
builder.Services.AddScoped<INotificationDispatcher, SignalRNotificationDispatcher>();
builder.Services.AddHostedService<DeliveryReminderService>();


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddScoped<IRevokedAccessTokenRepository, RevokedAccessTokenRepository>();
builder.Services.AddSingleton<UserConnectionManager>();

var app = builder.Build();

var applyMigrations =
    builder.Configuration.GetValue<bool>(
        "ApplyMigrations");

if (applyMigrations)
{
    using var scope = app.Services.CreateScope();

    var dbContext =
        scope.ServiceProvider
             .GetRequiredService<AppDbContext>();

    Log.Information("Applying database migrations...");

    await dbContext.Database.MigrateAsync();

    Log.Information("Database migrations completed.");
}

   if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

    if (app.Environment.IsDevelopment())
    {
        app.UseHangfireDashboard("/hangfire");
    }

    if (!app.Environment.IsDevelopment())
{
   app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseCors("AllowFrontend");

app.UseMiddleware<ExceptionMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/health");
app.MapHub<ChatHub>("/chatHub");
app.MapHub<NotificationHub>("/hubs/notification");

app.Run();
}
catch (Exception exception)
{
    Log.Fatal(exception, "Stopped program because of exception");
    throw;
}
finally
{
    await Log.CloseAndFlushAsync();
}














