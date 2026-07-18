using PaymentManagement.Business.DTOs;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Business.Businesses;

public class GastoBusiness : IGastoBusiness
{
    private readonly IGastoRepository _gastoRepository;
    private readonly ICategoriaRepository _categoriaRepository;

    public GastoBusiness(IGastoRepository gastoRepository, ICategoriaRepository categoriaRepository)
    {
        _gastoRepository = gastoRepository;
        _categoriaRepository = categoriaRepository;
    }

    public IEnumerable<Gasto> GetAll(string usuarioEmail)
    {
        return _gastoRepository.GetAll(NormalizeEmail(usuarioEmail));
    }

    public Gasto? GetById(int id, string usuarioEmail)
    {
        return _gastoRepository.GetById(id, NormalizeEmail(usuarioEmail));
    }

    public Gasto Create(GastoCreateUpdateDto request, string usuarioEmail)
    {
        var email = NormalizeEmail(usuarioEmail);
        var gasto = new Gasto
        {
            Descripcion = request.Descripcion.Trim(),
            Monto = request.Monto,
            Fecha = request.Fecha,
            CategoriaId = request.CategoriaId,
            CategoriaNombre = GetCategoriaNombre(request.CategoriaId, request.CategoriaNombre, email),
            MetodoPago = request.MetodoPago,
            TipoMonto = NormalizeTipoMonto(request.TipoMonto),
            Notas = NormalizeText(request.Notas),
            UsuarioEmail = email
        };

        return _gastoRepository.Create(gasto);
    }

    public Gasto? Update(int id, GastoCreateUpdateDto request, string usuarioEmail)
    {
        var email = NormalizeEmail(usuarioEmail);
        var gasto = new Gasto
        {
            Id = id,
            Descripcion = request.Descripcion.Trim(),
            Monto = request.Monto,
            Fecha = request.Fecha,
            CategoriaId = request.CategoriaId,
            CategoriaNombre = GetCategoriaNombre(request.CategoriaId, request.CategoriaNombre, email),
            MetodoPago = request.MetodoPago,
            TipoMonto = NormalizeTipoMonto(request.TipoMonto),
            Notas = NormalizeText(request.Notas),
            UsuarioEmail = email
        };

        return _gastoRepository.Update(gasto);
    }

    public bool Delete(int id, string usuarioEmail)
    {
        return _gastoRepository.Delete(id, NormalizeEmail(usuarioEmail));
    }

    private string GetCategoriaNombre(int categoriaId, string categoriaNombre, string usuarioEmail)
    {
        var categoria = _categoriaRepository.GetById(categoriaId, usuarioEmail);
        return categoria?.Nombre ?? categoriaNombre;
    }

    private static string? NormalizeText(string? value)
    {
        var normalized = value?.Trim();
        return string.IsNullOrWhiteSpace(normalized) ? null : normalized;
    }

    private static string NormalizeTipoMonto(string? value)
    {
        var normalized = value?.Trim().ToLowerInvariant();
        return normalized == "fijo" ? "fijo" : "variable";
    }

    private static string NormalizeEmail(string value)
    {
        return value.Trim().ToLowerInvariant();
    }
}
