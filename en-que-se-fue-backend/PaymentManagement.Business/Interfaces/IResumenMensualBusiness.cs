using PaymentManagement.Business.DTOs;

namespace PaymentManagement.Business.Interfaces;

public interface IResumenMensualBusiness
{
    ResumenMensualResponseDto Generate(ResumenMensualRequestDto request);
}
