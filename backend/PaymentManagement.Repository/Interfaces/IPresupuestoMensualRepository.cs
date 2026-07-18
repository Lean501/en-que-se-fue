using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Interfaces;

public interface IPresupuestoMensualRepository
{
    IEnumerable<PresupuestoMensual> GetAll(string usuarioEmail);
    PresupuestoMensual? GetByMonth(int mes, int anio, string usuarioEmail);
    PresupuestoMensual Save(PresupuestoMensual presupuesto);
    PresupuestoMensual? Update(int id, PresupuestoMensual presupuesto);
    bool Delete(int id, string usuarioEmail);
}
