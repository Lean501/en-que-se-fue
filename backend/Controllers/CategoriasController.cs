using Microsoft.AspNetCore.Mvc;
using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriasController : ControllerBase
{
    private readonly ICategoriaBusiness _categoriaBusiness;

    public CategoriasController(ICategoriaBusiness categoriaBusiness)
    {
        _categoriaBusiness = categoriaBusiness;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Categoria>> GetAll()
    {
        var usuarioEmail = GetUsuarioEmail();
        return usuarioEmail is null ? Unauthorized() : Ok(_categoriaBusiness.GetAll(usuarioEmail));
    }

    [HttpPost]
    public ActionResult<Categoria> Create(CategoriaCreateUpdateDto request)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var categoria = _categoriaBusiness.Create(request, usuarioEmail);
        return CreatedAtAction(nameof(GetAll), new { id = categoria.Id }, categoria);
    }

    [HttpPut("{id:int}")]
    public ActionResult<Categoria> Update(int id, CategoriaCreateUpdateDto request)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var categoria = _categoriaBusiness.Update(id, request, usuarioEmail);

        if (categoria is null)
        {
            return NotFound(new { message = "Categoria no encontrada." });
        }

        return Ok(categoria);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var deleted = _categoriaBusiness.Delete(id, usuarioEmail);

        if (!deleted)
        {
            return NotFound(new { message = "Categoria no encontrada." });
        }

        return NoContent();
    }

    private string? GetUsuarioEmail()
    {
        var value = Request.Headers["X-User-Email"].FirstOrDefault();
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
    }
}
