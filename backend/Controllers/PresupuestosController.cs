using Microsoft.AspNetCore.Mvc;
using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;

namespace PaymentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PresupuestosController : ControllerBase
{
    private readonly IPresupuestoMensualBusiness _presupuestoMensualBusiness;

    public PresupuestosController(IPresupuestoMensualBusiness presupuestoMensualBusiness)
    {
        _presupuestoMensualBusiness = presupuestoMensualBusiness;
    }

    [HttpGet]
    public ActionResult<IEnumerable<PresupuestoMensualDto>> GetAll()
    {
        var usuarioEmail = GetUsuarioEmail();
        return usuarioEmail is null ? Unauthorized() : Ok(_presupuestoMensualBusiness.GetAll(usuarioEmail));
    }

    [HttpPost]
    public ActionResult<PresupuestoMensualDto> Save(PresupuestoMensualSaveDto request)
    {
        var usuarioEmail = GetUsuarioEmail();
        return usuarioEmail is null ? Unauthorized() : Ok(_presupuestoMensualBusiness.Save(request, usuarioEmail));
    }

    [HttpPut("{id:int}")]
    public ActionResult<PresupuestoMensualDto> Update(int id, PresupuestoMensualSaveDto request)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        try
        {
            var presupuesto = _presupuestoMensualBusiness.Update(id, request, usuarioEmail);
            return presupuesto is null ? NotFound(new { message = "Presupuesto no encontrado." }) : Ok(presupuesto);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    public IActionResult Delete(int id)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var deleted = _presupuestoMensualBusiness.Delete(id, usuarioEmail);
        return deleted ? NoContent() : NotFound(new { message = "Presupuesto no encontrado." });
    }

    private string? GetUsuarioEmail()
    {
        var value = Request.Headers["X-User-Email"].FirstOrDefault();
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
    }
}
