using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/notifications")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationRepository _repo;

        public NotificationController(INotificationRepository repo)
        {
            _repo = repo;
        }

        private int GetUserId()
            => int.Parse(User.FindFirst("userId")!.Value);

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var data = await _repo.GetByUserIdAsync(GetUserId());
            return Ok(data);
        }

        [HttpPatch("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notif = await _repo.GetByIdAsync(id);

            if (notif == null)
                return NotFound();

            notif.IsRead = true;

            await _repo.SaveChangesAsync();

            return Ok();
        }
    }
}
