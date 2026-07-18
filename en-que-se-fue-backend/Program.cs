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
        var allowedOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:4200", "https://enquesefue.netlify.app" };

        policy
            .WithOrigins(allowedOrigins)
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

if (!app.Environment.IsProduction())
{
    app.UseHttpsRedirection();
}

app.UseCors(AngularCorsPolicy);
app.MapGet("/", () => new
{
    message = "Payment Management API funcionando correctamente.",
    endpoints = new[]
    {
        "/api/auth/login",
        "/api/gastos",
        "/api/categorias",
        "/api/resumenmensual",
        "/api/analisis/dashboard"
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
        throw new InvalidOperationException("No se encontro una cadena de conexion para PostgreSQL.");
    }

    if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri) || uri.Scheme is not ("postgres" or "postgresql"))
    {
        return databaseUrl;
    }

    var userInfo = uri.UserInfo.Split(':', 2);
    var username = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(0) ?? string.Empty);
    var password = Uri.UnescapeDataString(userInfo.ElementAtOrDefault(1) ?? string.Empty);

    var port = uri.Port > 0 ? uri.Port : 5432;

    return $"Host={uri.Host};Port={port};Database={uri.AbsolutePath.TrimStart('/')};Username={username};Password={password};SSL Mode=Require;Trust Server Certificate=true";
}