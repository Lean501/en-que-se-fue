using Microsoft.EntityFrameworkCore;
using PaymentManagement.Repository.Models;

namespace PaymentManagement.Repository.Data;

public class PaymentManagementDbContext : DbContext
{
    public PaymentManagementDbContext(DbContextOptions<PaymentManagementDbContext> options)
        : base(options)
    {
    }

    public DbSet<Categoria> Categorias => Set<Categoria>();
    public DbSet<Gasto> Gastos => Set<Gasto>();
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<PresupuestoMensual> PresupuestosMensuales => Set<PresupuestoMensual>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Categoria>(entity =>
        {
            entity.ToTable("Categorias");
            entity.HasKey(categoria => categoria.Id);
            entity.Property(categoria => categoria.Nombre).HasMaxLength(100).IsRequired();
            entity.Property(categoria => categoria.Color).HasMaxLength(20).IsRequired();
            entity.Property(categoria => categoria.Descripcion).HasMaxLength(500);
            entity.Property(categoria => categoria.UsuarioEmail).HasMaxLength(150).IsRequired();
        });

        modelBuilder.Entity<Gasto>(entity =>
        {
            entity.ToTable("Gastos");
            entity.HasKey(gasto => gasto.Id);
            entity.Property(gasto => gasto.Descripcion).HasMaxLength(200).IsRequired();
            entity.Property(gasto => gasto.Monto).HasColumnType("numeric(18,2)").IsRequired();
            entity.Property(gasto => gasto.Fecha).HasColumnType("date").IsRequired();
            entity.Property(gasto => gasto.CategoriaNombre).HasMaxLength(100).IsRequired();
            entity.Property(gasto => gasto.MetodoPago).HasMaxLength(30).IsRequired();
            entity.Property(gasto => gasto.TipoMonto).HasMaxLength(20).IsRequired();
            entity.Property(gasto => gasto.Notas).HasMaxLength(500);
            entity.Property(gasto => gasto.UsuarioEmail).HasMaxLength(150).IsRequired();
            entity.HasOne<Categoria>()
                .WithMany()
                .HasForeignKey(gasto => gasto.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.ToTable("Usuarios");
            entity.HasKey(usuario => usuario.Id);
            entity.Property(usuario => usuario.Nombre).HasMaxLength(100).IsRequired();
            entity.Property(usuario => usuario.Email).HasMaxLength(150).IsRequired();
            entity.Property(usuario => usuario.PasswordHash).HasMaxLength(200).IsRequired();
            entity.HasIndex(usuario => usuario.Email).IsUnique();
        });

        modelBuilder.Entity<PresupuestoMensual>(entity =>
        {
            entity.ToTable("PresupuestosMensuales");
            entity.HasKey(presupuesto => presupuesto.Id);
            entity.Property(presupuesto => presupuesto.Monto).HasColumnType("numeric(18,2)").IsRequired();
            entity.Property(presupuesto => presupuesto.OrigenFondos).HasMaxLength(30);
            entity.Property(presupuesto => presupuesto.UsuarioEmail).HasMaxLength(150).IsRequired();
            entity.HasIndex(presupuesto => new { presupuesto.UsuarioEmail, presupuesto.Mes, presupuesto.Anio });
        });
    }
}
