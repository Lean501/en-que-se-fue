namespace PaymentManagement.Business.DTOs;

public class AnalisisInteligenteResponseDto
{
    public string Titulo { get; set; } = "Analisis inteligente";
    public string Resumen { get; set; } = string.Empty;
    public List<string> Recomendaciones { get; set; } = [];
    public string Fuente { get; set; } = "local";
    public bool UsandoIa { get; set; }
}
