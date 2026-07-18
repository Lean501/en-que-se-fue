using PaymentManagement.Repository.Data;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Repositories;

public class GastoRepository : IGastoRepository
{
    private readonly PaymentManagementDbContext _dbContext;

    public GastoRepository(PaymentManagementDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IEnumerable<Gasto> GetAll(string usuarioEmail)
    {
        return _dbContext.Gastos
            .Where(gasto => gasto.UsuarioEmail == usuarioEmail)
            .OrderByDescending(gasto => gasto.Fecha)
            .ToList();
    }

    public Gasto? GetById(int id, string usuarioEmail)
    {
        return _dbContext.Gastos.FirstOrDefault(gasto => gasto.Id == id && gasto.UsuarioEmail == usuarioEmail);
    }

    public Gasto Create(Gasto gasto)
    {
        _dbContext.Gastos.Add(gasto);
        _dbContext.SaveChanges();
        return gasto;
    }

    public Gasto? Update(Gasto gasto)
    {
        var existingGasto = GetById(gasto.Id, gasto.UsuarioEmail);

        if (existingGasto is null)
        {
            return null;
        }

        existingGasto.Descripcion = gasto.Descripcion;
        existingGasto.Monto = gasto.Monto;
        existingGasto.Fecha = gasto.Fecha;
        existingGasto.CategoriaId = gasto.CategoriaId;
        existingGasto.CategoriaNombre = gasto.CategoriaNombre;
        existingGasto.MetodoPago = gasto.MetodoPago;
        existingGasto.TipoMonto = gasto.TipoMonto;
        existingGasto.Notas = gasto.Notas;
        _dbContext.SaveChanges();

        return existingGasto;
    }

    public bool Delete(int id, string usuarioEmail)
    {
        var gasto = GetById(id, usuarioEmail);

        if (gasto is null)
        {
            return false;
        }

        _dbContext.Gastos.Remove(gasto);
        _dbContext.SaveChanges();
        return true;
    }
}
