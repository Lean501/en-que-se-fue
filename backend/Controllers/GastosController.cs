using Microsoft.AspNetCore.Mvc;
using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GastosController : ControllerBase
{
    private readonly IGastoBusiness _gastoBusiness;

    public GastosController(IGastoBusiness gastoBusiness)
    {
        _gastoBusiness = gastoBusiness;
    }

    [HttpGet]
    public ActionResult<IEnumerable<Gasto>> GetAll()
    {
        var usuarioEmail = GetUsuarioEmail();
        return usuarioEmail is null ? Unauthorized() : Ok(_gastoBusiness.GetAll(usuarioEmail));
    }

    [HttpGet("{id:int}")]
    public ActionResult<Gasto> GetById(int id)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var gasto = _gastoBusiness.GetById(id, usuarioEmail);

        if (gasto is null)
        {
            return NotFound(new { message = "Gasto no encontrado." });
        }

        return Ok(gasto);
    }

    [HttpPost]
    public ActionResult<Gasto> Create(GastoCreateUpdateDto request)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var gasto = _gastoBusiness.Create(request, usuarioEmail);
        return CreatedAtAction(nameof(GetById), new { id = gasto.Id }, gasto);
    }

    [HttpPut("{id:int}")]
    public ActionResult<Gasto> Update(int id, GastoCreateUpdateDto request)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var gasto = _gastoBusiness.Update(id, request, usuarioEmail);

        if (gasto is null)
        {
            return NotFound(new { message = "Gasto no encontrado." });
        }

        return Ok(gasto);
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var deleted = _gastoBusiness.Delete(id, usuarioEmail);

        if (!deleted)
        {
            return NotFound(new { message = "Gasto no encontrado." });
        }

        return NoContent();
    }

    private string? GetUsuarioEmail()
    {
        var value = Request.Headers["X-User-Email"].FirstOrDefault();
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
    }
}
