using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Interfaces;

public interface ICategoriaRepository
{
    IEnumerable<Categoria> GetAll(string usuarioEmail);
    Categoria? GetById(int id, string usuarioEmail);
    Categoria Create(Categoria categoria);
    Categoria? Update(Categoria categoria);
    bool Delete(int id, string usuarioEmail);
}
