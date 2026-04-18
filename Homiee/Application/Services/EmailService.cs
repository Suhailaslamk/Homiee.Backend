using Homiee.Application.Interfaces.IServices;
using Homiee.Presentation.Controllers;
using System.Net;
using System.Net.Mail;



namespace Homiee.Application.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendAsync(string to,string subject,string body)
        {
            _logger.LogInformation("SMTP HOST: {host}", _config["Smtp:Host"]);
            using var smtp = new SmtpClient(_config["Smtp:Host"])
            {
                Port = int.Parse(_config["Smtp:Port"]!),
                Credentials = new NetworkCredential(
                    _config["Smtp:Username"],
                _config["Smtp:Password"]),
                EnableSsl = true
            };

           using var mail = new MailMessage
            {
                From = new MailAddress(_config["Smtp:Username"]!),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            mail.To.Add(to);

            await smtp.SendMailAsync(mail);
        }
    }
}
