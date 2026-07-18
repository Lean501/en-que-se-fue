using PaymentManagement.Business.DTOs;

namespace PaymentManagement.Business.Interfaces;

public interface IPresupuestoMensualBusiness
{
    IEnumerable<PresupuestoMensualDto> GetAll(string usuarioEmail);
    PresupuestoMensualDto Save(PresupuestoMensualSaveDto request, string usuarioEmail);
    PresupuestoMensualDto? Update(int id, PresupuestoMensualSaveDto request, string usuarioEmail);
    bool Delete(int id, string usuarioEmail);
}
