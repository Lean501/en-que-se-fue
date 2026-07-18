using PaymentManagement.Business.DTOs;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.Interfaces;

public interface ICategoriaBusiness
{
    IEnumerable<Categoria> GetAll(string usuarioEmail);
    Categoria Create(CategoriaCreateUpdateDto request, string usuarioEmail);
    Categoria? Update(int id, CategoriaCreateUpdateDto request, string usuarioEmail);
    bool Delete(int id, string usuarioEmail);
}
