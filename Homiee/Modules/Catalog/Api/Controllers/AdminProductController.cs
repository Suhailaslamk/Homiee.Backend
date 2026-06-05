using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Homiee.Modules.Catalog.Application.Dtos;
using Homiee.Modules.Catalog.Application.IServices;

namespace Homiee.Modules.Catalog.Api.Controllers
{
    
        [Route("api/admin/products")]
        [ApiController]
        [Authorize(Roles = "Admin")]
        public class AdminProductController : ControllerBase
        {
            private readonly IAdminProductService _service;

            public AdminProductController(IAdminProductService service)
            {
                _service = service;
            }

            [HttpGet]
            public async Task<IActionResult> GetAll([FromQuery] AdminProductQueryDto query)
            {
                var result = await _service.GetAll(query);
                return StatusCode(result.StatusCode, result);
            }

            [HttpGet("{id}")]
            public async Task<IActionResult> GetById(int id)
            {
                var result = await _service.GetById(id);
                return StatusCode(result.StatusCode, result);
            }

            //[HttpPost("{id}/approve")]
            //public async Task<IActionResult> Approve(int id)
            //{
            //    var result = await _service.Approve(id);
            //    return StatusCode(result.StatusCode, result);
            //}

            

            [HttpDelete("{id}")]
            public async Task<IActionResult> Delete(int id)
            {
                var result = await _service.Delete(id);
                return StatusCode(result.StatusCode, result);
            }
        }
    }
