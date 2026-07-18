using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.Businesses;

public class PresupuestoMensualBusiness : IPresupuestoMensualBusiness
{
    private readonly IPresupuestoMensualRepository _presupuestoMensualRepository;

    public PresupuestoMensualBusiness(IPresupuestoMensualRepository presupuestoMensualRepository)
    {
        _presupuestoMensualRepository = presupuestoMensualRepository;
    }

    public IEnumerable<PresupuestoMensualDto> GetAll(string usuarioEmail)
    {
        return _presupuestoMensualRepository.GetAll(NormalizeEmail(usuarioEmail)).Select(ToDto);
    }

    public PresupuestoMensualDto Save(PresupuestoMensualSaveDto request, string usuarioEmail)
    {
        var presupuesto = _presupuestoMensualRepository.Save(new PresupuestoMensual
        {
            Mes = request.Mes,
            Anio = request.Anio,
            Monto = request.Monto,
            OrigenFondos = NormalizeText(request.OrigenFondos),
            UsuarioEmail = NormalizeEmail(usuarioEmail)
        });

        return ToDto(presupuesto);
    }

    public PresupuestoMensualDto? Update(int id, PresupuestoMensualSaveDto request, string usuarioEmail)
    {
        var presupuesto = _presupuestoMensualRepository.Update(id, new PresupuestoMensual
        {
            Mes = request.Mes,
            Anio = request.Anio,
            Monto = request.Monto,
            OrigenFondos = NormalizeText(request.OrigenFondos),
            UsuarioEmail = NormalizeEmail(usuarioEmail)
        });

        return presupuesto is null ? null : ToDto(presupuesto);
    }

    public bool Delete(int id, string usuarioEmail)
    {
        return _presupuestoMensualRepository.Delete(id, NormalizeEmail(usuarioEmail));
    }

    private static PresupuestoMensualDto ToDto(PresupuestoMensual presupuesto)
    {
        return new PresupuestoMensualDto
        {
            Id = presupuesto.Id,
            Mes = presupuesto.Mes,
            Anio = presupuesto.Anio,
            Monto = presupuesto.Monto,
            OrigenFondos = presupuesto.OrigenFondos
        };
    }

    private static string? NormalizeText(string? value)
    {
        var normalized = value?.Trim();
        if (normalized?.Length > 30)
        {
            normalized = normalized[..30];
        }

        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string NormalizeEmail(string value)
    {
        return value.Trim().ToLowerInvariant();
    }
}
