namespace PaymentManagement.Business.DTOs;

public class PresupuestoMensualSaveDto
{
    public int Mes { get; set; }
    public int Anio { get; set; }
    public decimal Monto { get; set; }
    public string? OrigenFondos { get; set; }
}
