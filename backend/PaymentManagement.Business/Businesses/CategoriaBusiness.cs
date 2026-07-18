using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.Businesses;

public class CategoriaBusiness : ICategoriaBusiness
{
    private readonly ICategoriaRepository _categoriaRepository;

    public CategoriaBusiness(ICategoriaRepository categoriaRepository)
    {
        _categoriaRepository = categoriaRepository;
    }

    public IEnumerable<Categoria> GetAll(string usuarioEmail)
    {
        return _categoriaRepository.GetAll(NormalizeEmail(usuarioEmail));
    }

    public Categoria Create(CategoriaCreateUpdateDto request, string usuarioEmail)
    {
        var categoria = new Categoria
        {
            Nombre = request.Nombre,
            Color = request.Color,
            Descripcion = NormalizeText(request.Descripcion),
            UsuarioEmail = NormalizeEmail(usuarioEmail)
        };

        return _categoriaRepository.Create(categoria);
    }

    public Categoria? Update(int id, CategoriaCreateUpdateDto request, string usuarioEmail)
    {
        var categoria = new Categoria
        {
            Id = id,
            Nombre = request.Nombre,
            Color = request.Color,
            Descripcion = NormalizeText(request.Descripcion),
            UsuarioEmail = NormalizeEmail(usuarioEmail)
        };

        return _categoriaRepository.Update(categoria);
    }

    public bool Delete(int id, string usuarioEmail)
    {
        return _categoriaRepository.Delete(id, NormalizeEmail(usuarioEmail));
    }

    private static string? NormalizeText(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string NormalizeEmail(string value)
    {
        return value.Trim().ToLowerInvariant();
    }
}
