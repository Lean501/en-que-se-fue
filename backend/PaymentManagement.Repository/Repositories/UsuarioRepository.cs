using PaymentManagement.Repository.Data;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Repositories;

public class UsuarioRepository : IUsuarioRepository
{
    private readonly PaymentManagementDbContext _dbContext;

    public UsuarioRepository(PaymentManagementDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public Usuario? GetByEmail(string email)
    {
        return _dbContext.Usuarios.FirstOrDefault(usuario => usuario.Email == email);
    }

    public Usuario Create(Usuario usuario)
    {
        _dbContext.Usuarios.Add(usuario);
        _dbContext.SaveChanges();
        return usuario;
    }

    public Usuario Update(Usuario usuario)
    {
        _dbContext.Usuarios.Update(usuario);
        _dbContext.SaveChanges();
        return usuario;
    }

    public bool ExistsByEmail(string email)
    {
        return _dbContext.Usuarios.Any(usuario => usuario.Email == email);
    }
}
