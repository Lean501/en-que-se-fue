using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Interfaces;

public interface IGastoRepository
{
    IEnumerable<Gasto> GetAll(string usuarioEmail);
    Gasto? GetById(int id, string usuarioEmail);
    Gasto Create(Gasto gasto);
    Gasto? Update(Gasto gasto);
    bool Delete(int id, string usuarioEmail);
}
