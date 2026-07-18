using Microsoft.AspNetCore.Mvc;
using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;

namespace PaymentManagement.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthBusiness _authBusiness;

    public AuthController(IAuthBusiness authBusiness)
    {
        _authBusiness = authBusiness;
    }

    [HttpPost("login")]
    public ActionResult<LoginResponseDto> Login(LoginRequestDto request)
    {
        var response = _authBusiness.Login(request);

        if (response is null)
        {
            return Unauthorized(new { message = "Usuario o contraseña incorrectos." });
        }

        return Ok(response);
    }

    [HttpPost("register")]
    public ActionResult<LoginResponseDto> Register(RegisterRequestDto request)
    {
        var response = _authBusiness.Register(request);

        if (response is null)
        {
            return Conflict(new { message = "Ya existe un usuario registrado con ese correo." });
        }

        return Ok(response);
    }

    [HttpGet("me")]
    public ActionResult<LoginResponseDto> Me()
    {
        var email = Request.Headers["X-User-Email"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized();
        }

        var response = _authBusiness.GetCurrentUser(email);
        return response is null ? NotFound(new { message = "Usuario no encontrado." }) : Ok(response);
    }

    [HttpPut("profile")]
    public ActionResult<LoginResponseDto> UpdateProfile(UpdateProfileRequestDto request)
    {
        var email = Request.Headers["X-User-Email"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized();
        }

        var response = _authBusiness.UpdateProfile(email, request);
        return response is null
            ? BadRequest(new { message = "Ingresa un nombre válido de hasta 100 caracteres." })
            : Ok(response);
    }

    [HttpPut("password")]
    public ActionResult UpdatePassword(UpdatePasswordRequestDto request)
    {
        var email = Request.Headers["X-User-Email"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized();
        }

        var updated = _authBusiness.UpdatePassword(email, request);
        return updated
            ? Ok(new { message = "Contraseña actualizada correctamente." })
            : BadRequest(new { message = "La contraseña actual no es correcta o la nueva contraseña no es válida." });
    }
}
