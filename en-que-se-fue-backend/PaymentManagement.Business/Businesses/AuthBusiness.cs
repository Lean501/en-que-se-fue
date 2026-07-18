using System.Security.Cryptography;
using System.Text;
using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.Businesses;

public class AuthBusiness : IAuthBusiness
{
    private readonly IUsuarioRepository _usuarioRepository;

    public AuthBusiness(IUsuarioRepository usuarioRepository)
    {
        _usuarioRepository = usuarioRepository;
    }

    public LoginResponseDto? Login(LoginRequestDto request)
    {
        var email = NormalizeEmail(request.Usuario);
        var usuario = _usuarioRepository.GetByEmail(email);
        var isValidUser = usuario is not null && usuario.PasswordHash == HashPassword(request.Password);

        if (!isValidUser)
        {
            return null;
        }

        return new LoginResponseDto
        {
            Success = true,
            Usuario = usuario!.Email,
            UsuarioId = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Token = "token-simulado-para-proyecto-de-curso",
            Mensaje = "Login correcto."
        };
    }

    public LoginResponseDto? Register(RegisterRequestDto request)
    {
        var email = NormalizeEmail(request.Email);

        if (_usuarioRepository.ExistsByEmail(email))
        {
            return null;
        }

        var usuario = _usuarioRepository.Create(new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Email = email,
            PasswordHash = HashPassword(request.Password)
        });

        return new LoginResponseDto
        {
            Success = true,
            Usuario = usuario.Email,
            UsuarioId = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Token = "token-simulado-para-proyecto-de-curso",
            Mensaje = "Usuario registrado correctamente."
        };
    }

    public LoginResponseDto? GetCurrentUser(string email)
    {
        var usuario = _usuarioRepository.GetByEmail(NormalizeEmail(email));
        if (usuario is null)
        {
            return null;
        }

        return BuildResponse(usuario, "Usuario actual.");
    }

    public LoginResponseDto? UpdateProfile(string email, UpdateProfileRequestDto request)
    {
        var usuario = _usuarioRepository.GetByEmail(NormalizeEmail(email));
        var nombre = request.Nombre.Trim();

        if (usuario is null || string.IsNullOrWhiteSpace(nombre) || nombre.Length > 100)
        {
            return null;
        }

        usuario.Nombre = nombre;
        _usuarioRepository.Update(usuario);

        return BuildResponse(usuario, "Perfil actualizado correctamente.");
    }

    public bool UpdatePassword(string email, UpdatePasswordRequestDto request)
    {
        var usuario = _usuarioRepository.GetByEmail(NormalizeEmail(email));
        if (usuario is null)
        {
            return false;
        }

        var currentPasswordOk = usuario.PasswordHash == HashPassword(request.CurrentPassword);
        var newPassword = request.NewPassword.Trim();
        if (!currentPasswordOk || newPassword.Length < 6 || newPassword.Length > 100)
        {
            return false;
        }

        usuario.PasswordHash = HashPassword(newPassword);
        _usuarioRepository.Update(usuario);

        return true;
    }

    private static string NormalizeEmail(string email)
    {
        return email.Trim().ToLowerInvariant();
    }

    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password));
        return Convert.ToHexString(bytes);
    }

    private static LoginResponseDto BuildResponse(Usuario usuario, string mensaje)
    {
        return new LoginResponseDto
        {
            Success = true,
            Usuario = usuario.Email,
            UsuarioId = usuario.Id,
            Nombre = usuario.Nombre,
            Email = usuario.Email,
            Token = "token-simulado-para-proyecto-de-curso",
            Mensaje = mensaje
        };
    }
}
