using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Interfaces;

public interface IUsuarioRepository
{
    Usuario? GetByEmail(string email);
    Usuario Create(Usuario usuario);
    Usuario Update(Usuario usuario);
    bool ExistsByEmail(string email);
}
