using Homiee.Application.Interfaces.IRepository;
using Homiee.Application.Interfaces.IServices;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/chat")]
    public class ChatController : ControllerBase
    {
        private readonly IChatRepository _repo;

        public ChatController(IChatRepository repo)
        {
            _repo = repo;
        }

        private int GetUserId()
            => int.Parse(User.FindFirst("userId")!.Value);

        [HttpGet("{otherUserId}")]
        public async Task<IActionResult> GetConversation(int otherUserId)
        {
            var data = await _repo.GetConversation(GetUserId(), otherUserId);
            return Ok(data);
        }
    }
}
