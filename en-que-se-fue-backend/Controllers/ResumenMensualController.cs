using Microsoft.AspNetCore.Mvc;
using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;

namespace PaymentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResumenMensualController : ControllerBase
{
    private readonly IResumenMensualBusiness _resumenMensualBusiness;

    public ResumenMensualController(IResumenMensualBusiness resumenMensualBusiness)
    {
        _resumenMensualBusiness = resumenMensualBusiness;
    }

    [HttpPost]
    public ActionResult<ResumenMensualResponseDto> Create(ResumenMensualRequestDto request)
    {
        return Ok(_resumenMensualBusiness.Generate(request));
    }
}
