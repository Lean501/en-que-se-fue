namespace PaymentManagement.Repository.Models;

public class PresupuestoMensual
{
    public int Id { get; set; }
    public int Mes { get; set; }
    public int Anio { get; set; }
    public decimal Monto { get; set; }
    public string? OrigenFondos { get; set; }
    public string UsuarioEmail { get; set; } = string.Empty;
}
