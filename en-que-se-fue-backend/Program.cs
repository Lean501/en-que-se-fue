using Microsoft.EntityFrameworkCore;
using PaymentManagement.Business.Businesses;
using PaymentManagement.Business.Interfaces;
using PaymentManagement.Repository.Data;
using PaymentManagement.Repository.Interfaces;
using PaymentManagement.Repository.Repositories;

var builder = WebApplication.CreateBuilder(args);

const string AngularCorsPolicy = "AngularApp";

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddDbContext<PaymentManagementDbContext>(options =>
{
    options.UseNpgsql(GetPostgresConnectionString(builder.Configuration));
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(AngularCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddScoped<IGastoRepository, GastoRepository>();
builder.Services.AddScoped<ICategoriaRepository, CategoriaRepository>();
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<IPresupuestoMensualRepository, PresupuestoMensualRepository>();
builder.Services.AddScoped<IAuthBusiness, AuthBusiness>();
builder.Services.AddScoped<IGastoBusiness, GastoBusiness>();
builder.Services.AddScoped<ICategoriaBusiness, CategoriaBusiness>();
builder.Services.AddScoped<IResumenMensualBusiness, ResumenMensualBusiness>();
builder.Services.AddScoped<IPresupuestoMensualBusiness, PresupuestoMensualBusiness>();
builder.Services.AddHttpClient<IAnalisisInteligenteBusiness, AnalisisInteligenteBusiness>();

var app = builder.Build();

app.UseHttpsRedirection();
app.UseCors(AngularCorsPolicy);
app.MapGet("/", () => new
{
    message = "Payment Management API funcionando correctamente.",
    endpoints = new[]
    {
        "/api/auth/login",
        "/api/gastos",
        "/api/categorias",
        "/api/resumenmensual"
    }
});
app.MapControllers();

app.Run();

static string GetPostgresConnectionString(IConfiguration configuration)
{
    var databaseUrl = configuration["NETLIFY_DB_URL"]
        ?? configuration["NETLIFY_DATABASE_URL"]
        ?? configuration["DATABASE_URL"]
        ?? configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrWhiteSpace(databaseUrl))
    {
        throw new InvalidOperationException("No se encontrÃƒÂ³ una cadena de conexiÃƒÂ³n para PostgreSQL.");
    }

    if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri) || uri.Scheme is not ("postgres" or "postgresql"))
    {
        return databaseUrl;
    }

    var userInfo = uri.UserInfo.Split(':', 2);
    var username = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(0) ?? string.Empty);
    var password = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? string.Empty);

    return $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
}
