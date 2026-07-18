namespace PaymentManagement.Repository.Models;

public class Categoria
{
    public int Id { get; set; }
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = "#64748b";
    public string? Descripcion { get; set; }
    public string UsuarioEmail { get; set; } = string.Empty;
}
