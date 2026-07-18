using PaymentManagement.Repository.Data;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Repositories;

public class PresupuestoMensualRepository : IPresupuestoMensualRepository
{
    private readonly PaymentManagementDbContext _dbContext;

    public PresupuestoMensualRepository(PaymentManagementDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IEnumerable<PresupuestoMensual> GetAll(string usuarioEmail)
    {
        return _dbContext.PresupuestosMensuales
            .Where(presupuesto => presupuesto.UsuarioEmail == usuarioEmail)
            .OrderByDescending(presupuesto => presupuesto.Anio)
            .ThenByDescending(presupuesto => presupuesto.Mes)
            .ToList();
    }

    public PresupuestoMensual? GetByMonth(int mes, int anio, string usuarioEmail)
    {
        return _dbContext.PresupuestosMensuales.FirstOrDefault(presupuesto =>
            presupuesto.Mes == mes &&
            presupuesto.Anio == anio &&
            presupuesto.UsuarioEmail == usuarioEmail);
    }

    public PresupuestoMensual Save(PresupuestoMensual presupuesto)
    {
        _dbContext.PresupuestosMensuales.Add(presupuesto);
        _dbContext.SaveChanges();
        return presupuesto;
    }

    public PresupuestoMensual? Update(int id, PresupuestoMensual presupuesto)
    {
        var existing = _dbContext.PresupuestosMensuales.FirstOrDefault(item => item.Id == id && item.UsuarioEmail == presupuesto.UsuarioEmail);
        if (existing is null)
        {
            return null;
        }

        existing.Mes = presupuesto.Mes;
        existing.Anio = presupuesto.Anio;
        existing.Monto = presupuesto.Monto;
        existing.OrigenFondos = presupuesto.OrigenFondos;
        existing.UsuarioEmail = presupuesto.UsuarioEmail;
        _dbContext.SaveChanges();
        return existing;
    }

    public bool Delete(int id, string usuarioEmail)
    {
        var presupuesto = _dbContext.PresupuestosMensuales.FirstOrDefault(item => item.Id == id && item.UsuarioEmail == usuarioEmail);
        if (presupuesto is null)
        {
            return false;
        }

        _dbContext.PresupuestosMensuales.Remove(presupuesto);
        _dbContext.SaveChanges();
        return true;
    }
}
