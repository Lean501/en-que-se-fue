using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.Businesses;

public class ResumenMensualBusiness : IResumenMensualBusiness
{
    public ResumenMensualResponseDto Generate(ResumenMensualRequestDto request)
    {
        var gastosDelMes = request.Gastos
            .Where(gasto => request.TodosLosGastos || gasto.Fecha.Month == request.Mes && gasto.Fecha.Year == request.Anio)
            .ToList();

        var totalGastado = gastosDelMes.Sum(gasto => gasto.Monto);
        var categoriaMayorGasto = gastosDelMes
            .GroupBy(gasto => gasto.CategoriaNombre)
            .Select(group => new { Categoria = group.Key, Total = group.Sum(gasto => gasto.Monto) })
            .OrderByDescending(group => group.Total)
            .FirstOrDefault();

        var gastosMasImportantes = gastosDelMes
            .OrderByDescending(gasto => gasto.Monto)
            .Take(3)
            .ToList();

        var categoriaMayorGastoNombre = categoriaMayorGasto?.Categoria ?? "Sin datos";
        var recomendaciones = BuildRecommendations(totalGastado, categoriaMayorGasto?.Categoria, gastosMasImportantes);

        return new ResumenMensualResponseDto
        {
            TotalGastado = totalGastado,
            CategoriaMayorGasto = categoriaMayorGastoNombre,
            GastosMasImportantes = gastosMasImportantes,
            Recomendaciones = recomendaciones,
            Resumen = BuildSummary(request.Mes, request.Anio, request.TodosLosGastos, totalGastado, categoriaMayorGasto?.Categoria, gastosMasImportantes.FirstOrDefault()?.Monto)
        };
    }

    private static List<string> BuildRecommendations(decimal totalGastado, string? categoriaMayorGasto, List<Gasto> gastosMasImportantes)
    {
        var recomendaciones = new List<string>();

        if (totalGastado == 0)
        {
            recomendaciones.Add("Carga tus gastos con frecuencia para poder detectar patrones de consumo.");
            recomendaciones.Add("Crea categorias claras para saber en que se concentra tu dinero.");
            return recomendaciones;
        }

        if (!string.IsNullOrWhiteSpace(categoriaMayorGasto))
        {
            recomendaciones.Add($"Revisa la categoria {categoriaMayorGasto}, porque es la que mas impacto tiene en tus gastos.");
        }

        if (gastosMasImportantes.Count > 0)
        {
            recomendaciones.Add($"Analiza tu gasto mas alto ({gastosMasImportantes[0].Descripcion}) y evalua si se puede reducir, dividir o planificar mejor.");
        }

        recomendaciones.Add("Define un presupuesto por categoria y comparalo contra lo gastado antes de fin de mes.");
        recomendaciones.Add("Reserva primero una parte fija para ahorro o emergencias antes de hacer gastos variables.");
        return recomendaciones;
    }

    private static string BuildSummary(int mes, int anio, bool todosLosGastos, decimal totalGastado, string? categoriaMayorGasto, decimal? mayorGasto)
    {
        if (totalGastado == 0)
        {
            return todosLosGastos
                ? "No se registraron gastos para analizar."
                : $"En {mes}/{anio} no se registraron gastos para analizar.";
        }

        var mayorGastoTexto = mayorGasto.HasValue
            ? $" Tu gasto individual mas alto fue de {mayorGasto.Value:C}."
            : string.Empty;

        return todosLosGastos
            ? $"En todos los periodos gastaste un total de {totalGastado:C}. La categoria con mayor gasto fue {categoriaMayorGasto ?? "Sin datos"}.{mayorGastoTexto}"
            : $"En {mes}/{anio} gastaste un total de {totalGastado:C}. La categoria con mayor gasto fue {categoriaMayorGasto ?? "Sin datos"}.{mayorGastoTexto}";
    }
}
