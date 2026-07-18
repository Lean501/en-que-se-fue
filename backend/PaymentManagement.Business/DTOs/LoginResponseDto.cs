namespace PaymentManagement.Business.DTOs;

public class LoginResponseDto
{
    public bool Success { get; set; }
    public string Usuario { get; set; } = string.Empty;
    public int UsuarioId { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Token { get; set; } = string.Empty;
    public string Mensaje { get; set; } = string.Empty;
}
