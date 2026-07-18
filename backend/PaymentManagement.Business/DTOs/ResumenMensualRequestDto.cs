using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.DTOs;

public class ResumenMensualRequestDto
{
    public int Mes { get; set; }
    public int Anio { get; set; }
    public bool TodosLosGastos { get; set; }
    public List<Gasto> Gastos { get; set; } = [];
}
