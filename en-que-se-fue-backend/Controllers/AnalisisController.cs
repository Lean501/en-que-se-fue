using Microsoft.AspNetCore.Mvc;
using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;

namespace PaymentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnalisisController : ControllerBase
{
    private readonly IAnalisisInteligenteBusiness _analisisBusiness;

    public AnalisisController(IAnalisisInteligenteBusiness analisisBusiness)
    {
        _analisisBusiness = analisisBusiness;
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<AnalisisInteligenteResponseDto>> GetDashboardAnalysis([FromQuery] int? mes, [FromQuery] int? anio)
    {
        var usuarioEmail = GetUsuarioEmail();
        if (usuarioEmail is null) return Unauthorized();

        var analisis = await _analisisBusiness.GenerateDashboardAnalysisAsync(usuarioEmail, mes, anio);
        return Ok(analisis);
    }

    private string? GetUsuarioEmail()
    {
        var value = Request.Headers["X-User-Email"].FirstOrDefault();
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
    }
}
