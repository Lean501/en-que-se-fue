using PaymentManagement.Business.DTOs;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.Interfaces;

public interface IGastoBusiness
{
    IEnumerable<Gasto> GetAll(string usuarioEmail);
    Gasto? GetById(int id, string usuarioEmail);
    Gasto Create(GastoCreateUpdateDto request, string usuarioEmail);
    Gasto? Update(int id, GastoCreateUpdateDto request, string usuarioEmail);
    bool Delete(int id, string usuarioEmail);
}
