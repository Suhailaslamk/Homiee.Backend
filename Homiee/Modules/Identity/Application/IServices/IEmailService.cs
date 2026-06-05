namespace Homiee.Modules.Identity.Application.IServices
{
    public interface IEmailService
    {
        Task SendAsync(string to, string subject, string body);
    }
}
