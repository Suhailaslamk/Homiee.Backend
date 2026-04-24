using Homiee.Application.DTOs;
using Homiee.Application.Interfaces.IServices;
using Homiee.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Homiee.Presentation.Controllers
{
    [Route("api/seller/products")]
    [ApiController]
    [Authorize(Roles = "Seller")]
    public class SellerProductController : ControllerBase
    {
        private readonly ISellerProductService _service;

        public SellerProductController(ISellerProductService service)
        {
            _service = service;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst("userId")?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
                throw new UnauthorizedAccessException("Invalid or missing token");

            if (!int.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedAccessException("Invalid userId claim");

            return userId;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateProductDto dto)
        {
            var result = await _service.CreateProduct(dto, GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateProductDto dto)
        {
            var result = await _service.UpdateProduct(id, dto, GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _service.DeleteProduct(id, GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] ProductQuery query)
        {
            var result = await _service.GetProducts(GetUserId(), query);
            return StatusCode(result.StatusCode, result);
        }
        [HttpGet("product/{id}")]
        public async Task<IActionResult> GetProduct(int id)
        {
            int userId = GetUserId();

            var result = await _service.GetProductById(id, userId);
            return StatusCode(result.StatusCode, result);
        }
        [HttpPost("{id}/images")]
        public async Task<IActionResult> AddImages(int id, [FromForm] AddProductImagesDto dto)
        {
            var result = await _service.AddImages(id, GetUserId(), dto.Images);
            return StatusCode(result.StatusCode, result);
        }
        [HttpPatch("{id}/stock")]
        public async Task<IActionResult> UpdateStock(int id, UpdateStockDto dto)
        {
            var result = await _service.UpdateStock(id, dto, GetUserId());
            return StatusCode(result.StatusCode, result);
        }
        [HttpDelete("images/{imageId}")]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var result = await _service.DeleteImage(imageId, GetUserId());
            return StatusCode(result.StatusCode, result);
        }

        [HttpPatch("images/{imageId}/set-primary")]
        public async Task<IActionResult> SetPrimary(int imageId)
        {
            var result = await _service.SetPrimaryImage(imageId, GetUserId());
            return StatusCode(result.StatusCode, result);
        }
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var result = await _service.GetCategories();
            return StatusCode(result.StatusCode, result);
        }
    }
}
