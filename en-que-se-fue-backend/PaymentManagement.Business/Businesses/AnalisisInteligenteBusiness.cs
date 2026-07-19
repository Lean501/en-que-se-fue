using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.Businesses;

public class AnalisisInteligenteBusiness : IAnalisisInteligenteBusiness
{
    private readonly IGastoRepository _gastoRepository;
    private readonly IPresupuestoMensualRepository _presupuestoRepository;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AnalisisInteligenteBusiness(
        IGastoRepository gastoRepository,
        IPresupuestoMensualRepository presupuestoRepository,
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _gastoRepository = gastoRepository;
        _presupuestoRepository = presupuestoRepository;
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<AnalisisInteligenteResponseDto> GenerateDashboardAnalysisAsync(string usuarioEmail, int? mes, int? anio)
    {
        var fecha = DateTime.Today;
        var selectedMonth = mes is >= 1 and <= 12 ? mes.Value : fecha.Month;
        var selectedYear = anio is > 1900 and < 3000 ? anio.Value : fecha.Year;

        var gastos = _gastoRepository.GetAll(NormalizeEmail(usuarioEmail))
            .Where(gasto => gasto.Fecha.Month == selectedMonth && gasto.Fecha.Year == selectedYear)
            .ToList();

        var presupuestos = _presupuestoRepository.GetAll(NormalizeEmail(usuarioEmail))
            .Where(presupuesto => presupuesto.Mes == selectedMonth && presupuesto.Anio == selectedYear)
            .ToList();

        var contexto = BuildContext(gastos, presupuestos, selectedMonth, selectedYear);
        var localResponse = BuildLocalResponse(contexto);

        var ollamaResponse = await TryGenerateWithOllamaAsync(contexto);
        if (string.IsNullOrWhiteSpace(ollamaResponse))
        {
            return localResponse;
        }

        return new AnalisisInteligenteResponseDto
        {
            Titulo = "Analisis inteligente",
            Resumen = CleanResponse(ollamaResponse),
            Recomendaciones = localResponse.Recomendaciones,
            Fuente = "ollama",
            UsandoIa = true
        };
    }

    private async Task<string?> TryGenerateWithOllamaAsync(AnalysisContext contexto)
    {
        var enabledValue = _configuration["AI:Enabled"];
        var enabled = string.IsNullOrWhiteSpace(enabledValue) || bool.TryParse(enabledValue, out var parsedEnabled) && parsedEnabled;
        if (!enabled)
        {
            return null;
        }

        var ollamaUrl = _configuration["AI:OllamaUrl"]?.TrimEnd('/') ?? "http://localhost:11434";
        var model = _configuration["AI:Model"] ?? "gemma4";
        var prompt = BuildPrompt(contexto);

        try
        {
            using var cts = new CancellationTokenSource(TimeSpan.FromSeconds(120));
            var response = await _httpClient.PostAsJsonAsync(
                $"{ollamaUrl}/api/generate",
                new
                {
                    model,
                    prompt,
                    stream = false,
                    options = new
                    {
                        temperature = 0.3,
                        num_predict = 700
                    }
                },
                cts.Token);

            if (!response.IsSuccessStatusCode)
            {
                return null;
            }

            var payload = await response.Content.ReadFromJsonAsync<OllamaGenerateResponse>(cancellationToken: cts.Token);
            return payload?.Response;
        }
        catch
        {
            return null;
        }
    }

    private static AnalysisContext BuildContext(List<Gasto> gastos, List<PresupuestoMensual> presupuestos, int mes, int anio)
    {
        var totalGastado = gastos.Sum(gasto => gasto.Monto);
        var totalPresupuestado = presupuestos.Sum(presupuesto => presupuesto.Monto);
        var gastoMasAlto = gastos.OrderByDescending(gasto => gasto.Monto).FirstOrDefault();
        var categoriaPrincipal = gastos
            .GroupBy(gasto => gasto.CategoriaNombre)
            .Select(group => new AnalysisAmount(group.Key, group.Sum(gasto => gasto.Monto)))
            .OrderByDescending(item => item.Total)
            .FirstOrDefault();
        var metodoPrincipal = gastos
            .GroupBy(gasto => gasto.MetodoPago)
            .Select(group => new AnalysisAmount(group.Key, group.Sum(gasto => gasto.Monto)))
            .OrderByDescending(item => item.Total)
            .FirstOrDefault();
        var fijos = gastos.Where(gasto => string.Equals(gasto.TipoMonto, "fijo", StringComparison.OrdinalIgnoreCase)).Sum(gasto => gasto.Monto);
        var variables = gastos.Where(gasto => !string.Equals(gasto.TipoMonto, "fijo", StringComparison.OrdinalIgnoreCase)).Sum(gasto => gasto.Monto);
        var categorias = gastos
            .GroupBy(gasto => gasto.CategoriaNombre)
            .Select(group => new AnalysisAmount(group.Key, group.Sum(gasto => gasto.Monto)))
            .OrderByDescending(item => item.Total)
            .Take(5)
            .ToList();

        return new AnalysisContext(
            mes,
            anio,
            totalGastado,
            totalPresupuestado,
            totalPresupuestado - totalGastado,
            gastoMasAlto,
            categoriaPrincipal,
            metodoPrincipal,
            fijos,
            variables,
            categorias,
            gastos.Count);
    }

    private static AnalisisInteligenteResponseDto BuildLocalResponse(AnalysisContext contexto)
    {
        if (contexto.TotalGastado == 0)
        {
            return new AnalisisInteligenteResponseDto
            {
                Titulo = "Análisis inteligente",
                Resumen = $"En {contexto.Mes}/{contexto.Anio} todavía no hay gastos cargados. Cuando registres movimientos, vas a ver un análisis del mes con el peso de tus categorías, la diferencia entre gastos fijos y variables, y recomendaciones para ordenar mejor el presupuesto.",
                Recomendaciones =
                [
                    "Carga los gastos apenas ocurren para que el análisis sea más preciso.",
                    "Separa gastos fijos y variables para detectar dónde tenés más margen de ajuste.",
                    "Agrega presupuestos del mes para comparar ingresos disponibles contra gastos."
                ]
            };
        }

        var categoria = contexto.CategoriaPrincipal?.Nombre ?? "Sin categoria";
        var categoriaTotal = contexto.CategoriaPrincipal?.Total ?? 0;
        var categoriaPorcentaje = Percent(categoriaTotal, contexto.TotalGastado);
        var fijosPorcentaje = Percent(contexto.Fijos, contexto.TotalGastado);
        var variablesPorcentaje = Percent(contexto.Variables, contexto.TotalGastado);
        var presupuestoTexto = contexto.TotalPresupuestado > 0
            ? contexto.Restante >= 0
                ? $"Todavía te quedan {Money(contexto.Restante)} disponibles del presupuesto cargado."
                : $"Ya superaste el presupuesto cargado por {Money(Math.Abs(contexto.Restante))}."
            : "Todavía no hay un presupuesto cargado para comparar el mes.";
        var gastoAlto = contexto.GastoMasAlto is null
            ? "no hay un gasto individual destacado"
            : $"{contexto.GastoMasAlto.Descripcion} por {Money(contexto.GastoMasAlto.Monto)}";

        var recomendaciones = new List<string>
        {
            $"Revisá primero {categoria}, porque concentra cerca del {categoriaPorcentaje:0}% del gasto del mes.",
            contexto.Variables > contexto.Fijos
                ? "Tus gastos variables pesan más que los fijos; ahí suele haber más margen para ajustar sin tocar obligaciones importantes."
                : "Tus gastos fijos tienen bastante peso; conviene revisar si alguno puede renegociarse, anticiparse o planificarse mejor.",
            contexto.TotalPresupuestado > 0
                ? "Antes de sumar un gasto grande, comparalo contra el presupuesto restante y contra tu meta de ahorro."
                : "Agregá un presupuesto del mes para medir cuánto queda disponible y detectar desvíos más rápido.",
            contexto.GastoMasAlto is not null
                ? $"Miraría el gasto '{contexto.GastoMasAlto.Descripcion}' por separado: si fue excepcional, conviene dejarlo identificado en notas."
                : "Cuando cargues más movimientos, el sistema va a poder separar gastos habituales de gastos excepcionales."
        };

        return new AnalisisInteligenteResponseDto
        {
            Titulo = "Análisis inteligente",
            Resumen = $"En {contexto.Mes}/{contexto.Anio} gastaste {Money(contexto.TotalGastado)} en {contexto.CantidadGastos} movimientos. La categoría con más peso fue {categoria}, que representa aproximadamente el {categoriaPorcentaje:0}% del total. Tu gasto más alto fue {gastoAlto}. Los gastos fijos explican cerca del {fijosPorcentaje:0}% y los variables el {variablesPorcentaje:0}% del mes. {presupuestoTexto}",
            Recomendaciones = recomendaciones
        };
    }

    private static string BuildPrompt(AnalysisContext contexto)
    {
        var categorias = contexto.Categorias.Count == 0
            ? "Sin categorias cargadas."
            : string.Join(", ", contexto.Categorias.Select(item => $"{item.Nombre}: {Money(item.Total)}"));
        var gastoMasAlto = contexto.GastoMasAlto is null
            ? "Sin datos"
            : $"{contexto.GastoMasAlto.Descripcion} - {Money(contexto.GastoMasAlto.Monto)}";

        return $"""
        Sos un asistente financiero para una app de gastos personales.
        Responde en español argentino, claro, útil y un poco descriptivo.
        No uses simbolos de moneda. No inventes datos. No des consejos legales ni financieros profesionales.
        Devolve un unico parrafo de 8 a 10 frases cortas, con observaciones concretas y faciles de accionar.
        Menciona el peso de la categoria principal, la diferencia entre gastos fijos y variables, el presupuesto restante y una accion concreta para mejorar el mes.

        Datos del periodo {contexto.Mes}/{contexto.Anio}:
        Total gastado: {Money(contexto.TotalGastado)}
        Total presupuestado: {Money(contexto.TotalPresupuestado)}
        Presupuesto restante: {Money(contexto.Restante)}
        Cantidad de gastos: {contexto.CantidadGastos}
        Gasto mas alto: {gastoMasAlto}
        Categoria principal: {contexto.CategoriaPrincipal?.Nombre ?? "Sin datos"} ({Money(contexto.CategoriaPrincipal?.Total ?? 0)})
        Metodo principal: {contexto.MetodoPrincipal?.Nombre ?? "Sin datos"}
        Gastos fijos: {Money(contexto.Fijos)}
        Gastos variables: {Money(contexto.Variables)}
        Categorias: {categorias}
        """;
    }

    private static string CleanResponse(string value)
    {
        return value
            .Replace("$", string.Empty, StringComparison.Ordinal)
            .Replace("US", string.Empty, StringComparison.OrdinalIgnoreCase)
            .Trim();
    }

    private static string Money(decimal value)
    {
        return value.ToString("#,0.##", CultureInfo.InvariantCulture);
    }

    private static decimal Percent(decimal value, decimal total)
    {
        return total == 0 ? 0 : value / total * 100;
    }

    private static string NormalizeEmail(string usuarioEmail)
    {
        return usuarioEmail.Trim().ToLowerInvariant();
    }

    private sealed record AnalysisAmount(string Nombre, decimal Total);

    private sealed record AnalysisContext(
        int Mes,
        int Anio,
        decimal TotalGastado,
        decimal TotalPresupuestado,
        decimal Restante,
        Gasto? GastoMasAlto,
        AnalysisAmount? CategoriaPrincipal,
        AnalysisAmount? MetodoPrincipal,
        decimal Fijos,
        decimal Variables,
        List<AnalysisAmount> Categorias,
        int CantidadGastos);

    private sealed class OllamaGenerateResponse
    {
        public string? Response { get; set; }
    }
}
