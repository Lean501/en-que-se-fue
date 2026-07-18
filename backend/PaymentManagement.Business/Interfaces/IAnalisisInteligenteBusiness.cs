using PaymentManagement.Business.DTOs;

namespace PaymentManagement.Business.Interfaces;

public interface IAnalisisInteligenteBusiness
{
    Task<AnalisisInteligenteResponseDto> GenerateDashboardAnalysisAsync(string usuarioEmail, int? mes, int? anio);
}
