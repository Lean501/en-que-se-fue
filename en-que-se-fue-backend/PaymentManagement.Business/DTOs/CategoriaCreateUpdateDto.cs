namespace PaymentManagement.Business.DTOs;

public class CategoriaCreateUpdateDto
{
    public string Nombre { get; set; } = string.Empty;
    public string Color { get; set; } = "#64748b";
    public string? Descripcion { get; set; }
}
