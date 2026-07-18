namespace PaymentManagement.Repository.Models;

public class Gasto
{
    public int Id { get; set; }
    public string Descripcion { get; set; } = string.Empty;
    public decimal Monto { get; set; }
    public DateTime Fecha { get; set; }
    public int CategoriaId { get; set; }
    public string CategoriaNombre { get; set; } = string.Empty;
    public string MetodoPago { get; set; } = "tarjeta";
    public string TipoMonto { get; set; } = "variable";
    public string? Notas { get; set; }
    public string UsuarioEmail { get; set; } = string.Empty;
}
