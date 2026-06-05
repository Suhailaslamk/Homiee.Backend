using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.ComponentModel.DataAnnotations;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Homiee.Modules.Identity.Domain.Entities;
using Homiee.Shared.Common;
using Homiee.Shared.Domain.Enums;
using Homiee.Modules.Identity.Application.Dtos;
using Homiee.Modules.Identity.Application.IServices;
using Homiee.Modules.Identity.Application.IRepository;
using Homiee.Shared.Applications.IData;


namespace Homiee.Modules.Identity.Application.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepo;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;
        private readonly ITokenRepository _tokenRepo;
        private readonly IOtpRepository _otpRepo;
        private readonly ILogger<AuthService> _logger;
        private readonly IRevokedAccessTokenRepository _revokeAccessRepo;
        private readonly ISellersRepository _sellerRepo;
        private readonly IDeliveryRepository _deliveryRepo;
        private readonly IApplicationDbContext _context;

        public AuthService(IUserRepository userRepo, 
            IConfiguration config, 
            IEmailService emailService,
            ITokenRepository tokenRepo, 
            IOtpRepository otpRepo, 
            ILogger<AuthService> logger,
            IRevokedAccessTokenRepository revokeAccessRepo,
            ISellersRepository sellerRepo,
            IDeliveryRepository deliveryRepo,
            IApplicationDbContext context

            )

        {
            _userRepo = userRepo;
            _config = config;
            _emailService = emailService;
            _tokenRepo = tokenRepo;
            _otpRepo = otpRepo;
            _logger = logger;
            _revokeAccessRepo = revokeAccessRepo;
            _sellerRepo = sellerRepo;
            _deliveryRepo = deliveryRepo;
            _context = context;
        }
        private static string NormalizeEmail(string email)
        {
            return email
                .Trim()
                .Replace(" ", "")
                .ToLowerInvariant();
        }


        //public async Task<ApiResponse<string>> UserRegister(UserRegisterDto userRegisterDto)
        //{
        //    if (userRegisterDto == null)
        //        return new ApiResponse<string>(400, "Invalid Request");

        //    var normalizedEmail = NormalizeEmail(userRegisterDto.Email);

        //    if (userRegisterDto.Email.Contains(" "))
        //        return new ApiResponse<string>(400, "Email must not contain spaces");

        //    if (string.IsNullOrWhiteSpace(userRegisterDto.FullName))
        //        return new ApiResponse<string>(400, "Full name is required");

        //    if (string.IsNullOrWhiteSpace(normalizedEmail))
        //        return new ApiResponse<string>(400, "Email is required");
        //    if (!Regex.IsMatch(normalizedEmail,
        //        @"^(?![.])(?!.*[.]{2})[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"))
        //    {
        //        return new ApiResponse<string>(400, "Invalid email format");
        //    }
        //    if (!new EmailAddressAttribute().IsValid(normalizedEmail))
        //        return new ApiResponse<string>(400, "Invalid email format");

        //    if (string.IsNullOrWhiteSpace(userRegisterDto.Password) || userRegisterDto.Password.Length < 8)
        //        return new ApiResponse<string>(400, "Password must be at least 8 characters");

        //    if (!System.Text.RegularExpressions.Regex.IsMatch(
        //            userRegisterDto.Password,
        //            @"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).+$"))
        //        return new ApiResponse<string>(400, "Password is too weak");

        //    if (!Regex.IsMatch(userRegisterDto.FullName, @"^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$"))
        //        return new ApiResponse<string>(400, "Full name must contain only letters and valid separators");


        //    var existingUser = await _userRepo.GetByEmailAsync(normalizedEmail);

        //    if (existingUser != null)
        //    {
        //        if (existingUser.IsEmailVerified)
        //            return new ApiResponse<string>(409, "User Already verified please try to login");

        //        //return await ResendOtp(existingUser.Email);

        //        return new ApiResponse<string>(409,
        //"Email already registered but not verified. Please verify your email or request a new OTP.");
        //    }


        //    var user = new User
        //    {
        //        Name = userRegisterDto.FullName,
        //        Email = normalizedEmail,
        //        PasswordHash = BCrypt.Net.BCrypt.HashPassword(userRegisterDto.Password),
        //        IsEmailVerified = false,
        //        Role = UserRole.User,

        //    };

        //    await _userRepo.AddAsync(user);
        //    await _userRepo.SaveChangesAsync();

        //    var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

        //    var otpCode = new OtpCode
        //    {


        //        UserId = user.Id,
        //        Code = otp,
        //        ExpiresAt = DateTime.UtcNow.AddMinutes(5),
        //        IsUsed = false,
        //    };
        //    await _otpRepo.AddOtpAsync(otpCode);

        //    await _otpRepo.SaveChangesAsync();

        //    await _emailService.SendAsync(
        //        user.Email,
        //        "Verify Your Account",
        //        $"Your OTP is {otp}. It expires in 5 minutes");
        //    _logger.LogInformation("user with userId {user.Id} logged in", user.Id);
        //    return new ApiResponse<string>(200, "User Registered Successfully");
        //}




        private async Task<(User user, ApiResponse<string>? error)> CreateBaseUser(
          string fullName, string email, string password,UserRole role)
        {

            var normalizedEmail = NormalizeEmail(email);

            if (email.Contains(" "))
                return (null!, new ApiResponse<string>(400, "Email must not contain spaces"));
            if (string.IsNullOrWhiteSpace(email))
                return (null!, new ApiResponse<string>(400, "Email is required"));
           
            if (string.IsNullOrWhiteSpace(fullName))
                return (null!, new ApiResponse<string>(400, "Full name is required"));

            if (string.IsNullOrWhiteSpace(normalizedEmail))
                return (null!, new ApiResponse<string>(400, "Email is required"));

            if (email.Any(char.IsUpper))
                return (null!, new ApiResponse<string>(400, "Email must not contain uppercase letters"));

            if (!Regex.IsMatch(normalizedEmail,
                @"^(?![.])(?!.*[.]{2})[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"))
                return (null!, new ApiResponse<string>(400, "Invalid email format"));

            if (!new EmailAddressAttribute().IsValid(normalizedEmail))
                return (null!, new ApiResponse<string>(400, "Invalid email format"));

            if (string.IsNullOrWhiteSpace(password) || password.Length < 8)
                return (null!, new ApiResponse<string>(400, "Password must be at least 8 characters"));

            if (!Regex.IsMatch(password,
                @"^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).+$"))
                return (null!, new ApiResponse<string>(400, "Password is too weak"));

            if (!Regex.IsMatch(fullName, @"^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$"))
                return (null!, new ApiResponse<string>(400, "Full name must contain only letters and valid separators"));

            var existingUser = await _userRepo.GetByEmailAsync(normalizedEmail);

            if (existingUser != null)
            {
                if (existingUser.IsEmailVerified)
                    return (null!, new ApiResponse<string>(409, "User with this email already exists. Please log in."));

                return (null!, new ApiResponse<string>(409,
                    $"Email '{normalizedEmail}' is already registered but not verified. Please verify your account."));
            }

            var user = new User
            {
                Name = fullName,
                Email = normalizedEmail,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(password),
                IsEmailVerified = false,
                Role = role
            };

            await _userRepo.AddAsync(user);

            return (user, null);
        }

        private async Task SendOtp(User user)
        {
            var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

            var oldOtps = await _otpRepo.GetAllByUserIdAsync(user.Id);
            _otpRepo.RemoveRange(oldOtps);

            var otpCode = new OtpCode
            {
                UserId = user.Id,
                Code = otp,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };

            await _otpRepo.AddOtpAsync(otpCode);
            await _otpRepo.SaveChangesAsync();

            await _emailService.SendAsync(
                user.Email,
                "Verify Your Account",
                $"Your OTP is {otp}. It expires in 5 minutes");
        }


        public async Task<ApiResponse<string>> RegisterCustomer(UserRegisterDto dto)
        {
            var (user, error) = await CreateBaseUser(dto.FullName, dto.Email, dto.Password, UserRole.User);

            if (error != null)
                return error;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                user.Role = UserRole.User;
                await _userRepo.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error during customer registration");
                return new ApiResponse<string>(500, "Internal server error during registration");
            }

            await SendOtp(user);

            return new ApiResponse<string>(200, "Customer registered successfully");
        }

        public async Task<ApiResponse<string>> RegisterSeller(RegisterSellerDto dto)
        {
            var (user, error) = await CreateBaseUser(dto.FullName, dto.Email, dto.Password, UserRole.Seller);

            if (error != null)
                return error;

            user.Role = UserRole.Seller;


            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await _userRepo.SaveChangesAsync();

                var seller = new Seller
                {
                    UserId = user.Id,
                    BusinessName = dto.BusinessName,
                    Address = dto.Address,
                    Status = ApprovalStatus.Draft
                };

                await _sellerRepo.AddAsync(seller);
                await _sellerRepo.SaveChangesAsync();
                await transaction.CommitAsync();

            } catch
            {
                await transaction.RollbackAsync();
                throw;
            }

                await SendOtp(user);

            return new ApiResponse<string>(200, "Seller registered successfully");
        }

        public async Task<ApiResponse<string>> RegisterDelivery(RegisterDeliveryDto dto)
        {
            var (user, error) = await CreateBaseUser(dto.FullName, dto.Email, dto.Password, UserRole.DeliveryPartner);

            if (error != null)
                return error;

            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                user.Role = UserRole.DeliveryPartner;
                await _userRepo.SaveChangesAsync();

                var delivery = new DeliveryPartner
                {
                    UserId = user.Id,
                    VehicleType = dto.VehicleType
                };

                await _deliveryRepo.AddAsync(delivery);
                await _deliveryRepo.SaveChangesAsync();
                await transaction.CommitAsync();
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _logger.LogError(ex, "Error during delivery partner registration");
                return new ApiResponse<string>(500, "Internal server error during registration");
            }

            await SendOtp(user);

            return new ApiResponse<string>(200, "Delivery partner registered successfully");
        }
        public async Task<ApiResponse<object>> Login(LoginDto loginDto)
        {
            if (loginDto == null)
            {
                _logger.LogWarning("Login failed: Null request body");
                return new ApiResponse<object>(400, "Invalid request");
            }

            if (string.IsNullOrWhiteSpace(loginDto.Email) ||
    string.IsNullOrWhiteSpace(loginDto.Password))
            {
                _logger.LogWarning("Login failed: Missing credentials for Email '{Email}'", loginDto.Email);
                return new ApiResponse<object>(400, "Email and password are required");
            }

            if (loginDto.Email.Contains(" "))
            {
                _logger.LogWarning("Login failed: Email '{Email}' contains spaces", loginDto.Email);
                return new ApiResponse<object>(400, "Email must not contain spaces");
            }

            var normalizedEmail = NormalizeEmail(loginDto.Email);
            _logger.LogInformation("Attempting login for '{NormalizedEmail}'", normalizedEmail);

            var user = await _userRepo.GetByEmailAsync(normalizedEmail);
            if (user == null)
            {
                _logger.LogWarning("Login failed: User with email '{NormalizedEmail}' not found", normalizedEmail);
                return new ApiResponse<object>(401, "Invalid email or password");
            }

            if (!user.IsEmailVerified)
            {
                _logger.LogWarning("Login failed: User '{NormalizedEmail}' has not verified their email", normalizedEmail);
                return new ApiResponse<object>(400,"Email not verified");
            }

            if (user.IsBlocked)
            {
                _logger.LogWarning("Login blocked: User '{NormalizedEmail}' is blocked", normalizedEmail);
                return new ApiResponse<object>(400,"User blocked");
            }

            if (user.IsDeleted)
            {
                _logger.LogWarning("Login blocked: User '{NormalizedEmail}' account is deleted", normalizedEmail);
                return new ApiResponse<object>(403, "Account has been deleted");
            }

            if (user.Status == UserStatus.Suspended)
            {
                _logger.LogWarning("Login blocked: User '{NormalizedEmail}' account is suspended", normalizedEmail);
                return new ApiResponse<object>(403, "Your account is suspended");
            }

            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                _logger.LogWarning("Login failed: Invalid password for User '{NormalizedEmail}'", normalizedEmail);
                return new ApiResponse<object>(401, "Invalid email or password");
            }

            _logger.LogInformation("Login successful for User '{NormalizedEmail}' (ID: {UserId}, Role: {Role})", normalizedEmail, user.Id, user.Role);

            var accesstoken = GenerateAcessToken(user);
            var refreshToken = GenerateRefreshToken();
            var hashedToken = HashToken(refreshToken);

            var reToken = new RefreshToken
            {
                UserId = user.Id,
                Token = hashedToken,
                Expires = DateTime.UtcNow.AddDays(7),
                IsRevoked = false,
            };

            await _tokenRepo.AddAsync(reToken);
            await _tokenRepo.SaveChangesAsync();

            return new ApiResponse<object>(200, "login successfull", new
            {
                accesstoken,
                refreshToken
            });
        }
        public string GenerateAcessToken(User user)
        {
            var claims = new[]
            {
                new Claim("userId" , user.Id.ToString()),
                new Claim("userName",user.Name.ToString()),
                new Claim("email", user.Email),
                new Claim(ClaimTypes.Role,user.Role.ToString())

            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_config["JWT:Key"]!));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["JWT:Issuer"],
                audience: _config["JWT:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(_config["JWT:ExpiresAt"])),
                signingCredentials: creds
                );
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
        public string GenerateRefreshToken()
        {
            return Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        }

        public async Task<ApiResponse<string>> VerifyOtp(VerifyOtpDto verifyotpdto)
        {

            var normalizedEmail = NormalizeEmail(verifyotpdto.Email);

            if (verifyotpdto.Email.Contains(" "))
                return new ApiResponse<string>(400, "Email must not contain spaces");


            var user = await _userRepo.GetByEmailAsync(normalizedEmail);
            if (user == null)
                return new ApiResponse<string>(404, "User not found");

            if (user.IsEmailVerified)
                return new ApiResponse<string>(200, "Email already verified");

            var storedOtp = await _otpRepo.GetValidOtpAsync(user.Id, verifyotpdto.Otp);

            if (storedOtp == null)
            {
                // 🔥 get latest OTP to track attempts
                var latestOtp = await _otpRepo.GetLatestOtpByUserId(user.Id);

                if (latestOtp == null)
                    return new ApiResponse<string>(400, "No OTP found. Please request a new one.");

                if (latestOtp.AttemptCount >= latestOtp.MaxAttempts)
                    return new ApiResponse<string>(403, "Too many attempts. Request a new OTP.");


                latestOtp.AttemptCount++;
                await _otpRepo.SaveChangesAsync();

                if (latestOtp.IsUsed || latestOtp.ExpiresAt <= DateTime.UtcNow)
                    return new ApiResponse<string>(400, "OTP has expired. Please request a new one.");



                if (latestOtp.Code != verifyotpdto.Otp)
                    return new ApiResponse<string>(400, "Invalid OTP.");


                latestOtp.IsUsed = true;
                user.IsEmailVerified = true;
                await _userRepo.SaveChangesAsync();
                var allOtps = await _otpRepo.GetAllByUserIdAsync(user.Id);
                _otpRepo.RemoveRange(allOtps);
                await _otpRepo.SaveChangesAsync();

                return new ApiResponse<string>(200, "Email verified successfully");
            }


            storedOtp.IsUsed = true;
            user.IsEmailVerified = true;
            await _userRepo.SaveChangesAsync();
            var oldOtps = await _otpRepo.GetAllByUserIdAsync(user.Id);
            _otpRepo.RemoveRange(oldOtps);
            await _otpRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "Email Verified Succesfully");
        }
        public async Task<ApiResponse<string>> ResendOtp(string email)
        {
            if (email == null)
                return new ApiResponse<string>(400, "Email is required");

            if (email.Contains(" "))
                return new ApiResponse<string>(400, "Email must not contain spaces");


            var normalizedEmail = NormalizeEmail(email);

            var user = await _userRepo.GetByEmailAsync(normalizedEmail);


            if (user == null)
                return new ApiResponse<string>(404, "User not found");

            if (user.LastOtpSentAt.HasValue &&
                DateTime.UtcNow - user.LastOtpSentAt.Value < TimeSpan.FromSeconds(60))
            {
                return new ApiResponse<string>(429, "Please wait before requesting another OTP");
            }

            if (user.IsEmailVerified)
                return new ApiResponse<string>(400, "Email already verified");

            var otp = RandomNumberGenerator.GetInt32(100000, 999999).ToString();

            var otpCode = new OtpCode
            {
                UserId = user.Id,
                Code = otp,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                IsUsed = false
            };


            var oldOtps = await _otpRepo.GetAllByUserIdAsync(user.Id);
            _otpRepo.RemoveRange(oldOtps);

            await _otpRepo.AddOtpAsync(otpCode);
            await _otpRepo.SaveChangesAsync();

            await _emailService.SendAsync(
                user.Email,
                "Resend OTP",
                $"Your OTP is {otp}. It expires in 5 minutes");

            user.LastOtpSentAt = DateTime.UtcNow;
            await _userRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "OTP resent successfully");
        }

       
        public async Task<ApiResponse<object>> RefreshToken(string refreshToken)
        {
            var hashedToken = HashToken(refreshToken);

            var storedToken = await _tokenRepo.GetByTokenAsync(hashedToken);

           



            if (storedToken == null || storedToken.Expires < DateTime.UtcNow)
                return new ApiResponse<object>(401, "Invalid or expired token");


            if (storedToken.IsRevoked)
            {
                var allUserTokens = await _tokenRepo.GetAllTokensByUserIdAsync(storedToken.UserId);
                var userTokens = await _tokenRepo.GetRefreshTokenByAsync(storedToken.UserId);
                
                foreach (var token in allUserTokens.Where(t => !t.IsRevoked))
                {
                    token.IsRevoked = true;
                }

                await _tokenRepo.SaveChangesAsync();

                _logger.LogWarning(
        "Refresh token reuse detected for UserId {UserId}. All sessions revoked.",
        storedToken.UserId);

                return new ApiResponse<object>(401, "Token reuse detected. All sessions revoked.");
            }

            storedToken.IsRevoked = true;
            await _tokenRepo.SaveChangesAsync();



            var user = await _userRepo.GetByIdAsync(storedToken.UserId);
            if (user == null)
                return new ApiResponse<object>(401, "User not found");


            var newAccessToken = GenerateAcessToken(user);
            var newRefreshToken = GenerateRefreshToken();
            var newHashedToken = HashToken(newRefreshToken);



            var newToken = new RefreshToken
            {
                UserId = user.Id,
                Token = newHashedToken,
                Expires = DateTime.UtcNow.AddDays(7),
                IsRevoked = false
            };

            await _tokenRepo.AddAsync(newToken);
            await _tokenRepo.SaveChangesAsync();

            return new ApiResponse<object>(200, "Token refreshed", new
            {
                accesstoken = newAccessToken,
                refreshToken = newRefreshToken
            });
        }

        private string HashToken(string token)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(token));
            return Convert.ToBase64String(bytes);
        }

        public async Task<ApiResponse<string>> Logout(int userId, string accessToken)
        {
            var tokens = await _tokenRepo.GetRefreshTokenByAsync(userId);

            if (!tokens.Any())
            {
                return new ApiResponse<string>(200, "User Already Logged Out");
            }



            foreach (var token in tokens)
            {
                token.IsRevoked = true;
            }
            await _tokenRepo.SaveChangesAsync();

            _logger.LogInformation("user with userId {userId} logged out", userId);
            var hashedAccessToken = HashToken(accessToken);

            await _revokeAccessRepo.AddAsync(new RevokedAccessToken
            {
                Token = hashedAccessToken,
                ExpiresAt = DateTime.UtcNow.AddMinutes(
        Convert.ToDouble(_config["JWT:ExpiresAt"]))
            });

            

            await _revokeAccessRepo.SaveChangesAsync();

            return new ApiResponse<string>(200, "User Logged Out Successfully");
        }
    }
}
