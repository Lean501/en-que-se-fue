using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.DTOs;

public class ResumenMensualResponseDto
{
    public decimal TotalGastado { get; set; }
    public string CategoriaMayorGasto { get; set; } = string.Empty;
    public List<Gasto> GastosMasImportantes { get; set; } = [];
    public List<string> Recomendaciones { get; set; } = [];
    public string Resumen { get; set; } = string.Empty;
}
