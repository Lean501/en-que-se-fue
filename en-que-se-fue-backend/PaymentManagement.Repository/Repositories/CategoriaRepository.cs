using PaymentManagement.Repository.Data;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Repositories;

public class CategoriaRepository : ICategoriaRepository
{
    private readonly PaymentManagementDbContext _dbContext;

    public CategoriaRepository(PaymentManagementDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public IEnumerable<Categoria> GetAll(string usuarioEmail)
    {
        return _dbContext.Categorias
            .Where(categoria => categoria.UsuarioEmail == usuarioEmail)
            .OrderBy(categoria => categoria.Nombre)
            .ToList();
    }

    public Categoria? GetById(int id, string usuarioEmail)
    {
        return _dbContext.Categorias.FirstOrDefault(categoria => categoria.Id == id && categoria.UsuarioEmail == usuarioEmail);
    }

    public Categoria Create(Categoria categoria)
    {
        _dbContext.Categorias.Add(categoria);
        _dbContext.SaveChanges();
        return categoria;
    }

    public Categoria? Update(Categoria categoria)
    {
        var existingCategoria = GetById(categoria.Id, categoria.UsuarioEmail);

        if (existingCategoria is null)
        {
            return null;
        }

        existingCategoria.Nombre = categoria.Nombre;
        existingCategoria.Color = categoria.Color;
        existingCategoria.Descripcion = categoria.Descripcion;
        _dbContext.SaveChanges();

        return existingCategoria;
    }

    public bool Delete(int id, string usuarioEmail)
    {
        var categoria = GetById(id, usuarioEmail);

        if (categoria is null)
        {
            return false;
        }

        var hasGastos = _dbContext.Gastos.Any(gasto => gasto.CategoriaId == id && gasto.UsuarioEmail == usuarioEmail);
        if (hasGastos)
        {
            return false;
        }

        _dbContext.Categorias.Remove(categoria);
        _dbContext.SaveChanges();
        return true;
    }
}
