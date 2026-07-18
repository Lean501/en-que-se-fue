# Â¿En QuÃ© Se Fue?

Â¿En QuÃ© Se Fue? es una aplicaciÃ³n web para administrar gastos personales, presupuestos, categorÃ­as, alertas y planificaciÃ³n mensual. El objetivo del proyecto es ayudar al usuario a registrar sus movimientos, entender en quÃ© se fue su dinero y tomar mejores decisiones sobre sus gastos.

La aplicaciÃ³n cuenta con autenticaciÃ³n de usuarios, por lo que cada persona puede tener sus propios datos separados dentro del sistema.

## DescripciÃ³n General

El sistema permite registrar gastos, organizarlos por categorÃ­as, cargar presupuestos mensuales, definir metas de ahorro y revisar un dashboard con informaciÃ³n resumida de la situaciÃ³n financiera del usuario.

AdemÃ¡s, incluye una secciÃ³n de anÃ¡lisis inteligente que puede trabajar con Ollama de forma local. Si Ollama no estÃ¡ disponible, el backend genera un anÃ¡lisis local para que la aplicaciÃ³n siga funcionando normalmente.

## Stack TecnolÃ³gico

### Frontend

- Angular 18
- TypeScript
- HTML
- CSS
- RxJS
- LocalStorage para sesiÃ³n y preferencias visuales

### Backend

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Npgsql Entity Framework Core Provider
- Arquitectura por capas:
  - API
  - Business
  - Repository

### Base de Datos

- PostgreSQL local o PostgreSQL online
- Compatible con Netlify Database, ya que Netlify Database utiliza PostgreSQL

### Inteligencia Artificial

- Ollama local
- Modelo configurable desde `appsettings.json`
- Resumen local automÃ¡tico cuando Ollama no estÃ¡ disponible

## InstalaciÃ³n y EjecuciÃ³n

### Requisitos Previos

Antes de ejecutar el proyecto, es necesario tener instalado:

- Node.js
- Angular CLI
- .NET 10 SDK
- PostgreSQL
- pgAdmin, DBeaver o cualquier cliente compatible con PostgreSQL
- Ollama, opcional para usar el anÃ¡lisis inteligente con IA local

## ConfiguraciÃ³n de la Base de Datos

### OpciÃ³n 1: PostgreSQL local

1. Instalar PostgreSQL.
2. Crear una base de datos llamada:

```text
PaymentManagementDb
```

3. Ejecutar el script ubicado en:

```text
database/postgresql-schema.sql
```

4. Revisar la cadena de conexiÃ³n del backend en `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=PaymentManagementDb;Username=postgres;Password=postgres"
  }
}
```

Si tu usuario o contraseÃ±a de PostgreSQL son diferentes, se deben modificar en esa cadena de conexiÃ³n.

### OpciÃ³n 2: Netlify Database

Si se utiliza Netlify Database, se puede configurar la cadena de conexiÃ³n mediante una variable de entorno:

```text
NETLIFY_DATABASE_URL
```

TambiÃ©n es compatible con:

```text
DATABASE_URL
```

El backend detecta esas variables y las convierte automÃ¡ticamente al formato de conexiÃ³n usado por Npgsql.

## EjecuciÃ³n del Backend

Desde una terminal, ingresar a la carpeta del backend:

```bash
cd backend
```

Restaurar las dependencias:

```bash
dotnet restore
```

Ejecutar la API:

```bash
dotnet run
```

La API queda disponible en una URL similar a:

```text
https://localhost:53367
http://localhost:53368
```

## EjecuciÃ³n del Frontend

Desde otra terminal, ingresar a la carpeta del frontend:

```bash
cd en-que-se-fue
```

Instalar las dependencias:

```bash
npm install
```

Ejecutar la aplicaciÃ³n:

```bash
npm start
```

La aplicaciÃ³n queda disponible en:

```text
http://localhost:4200
```

## ConfiguraciÃ³n Opcional de Ollama

Para utilizar el anÃ¡lisis inteligente con IA local:

1. Instalar Ollama.
2. Descargar un modelo local, por ejemplo:

```bash
ollama pull gemma4
```

3. Verificar que Ollama estÃ© ejecutÃ¡ndose:

```bash
ollama list
```

4. Revisar la configuraciÃ³n del backend en `appsettings.json`:

```json
{
  "AI": {
    "Enabled": true,
    "Provider": "Ollama",
    "OllamaUrl": "http://localhost:11434",
    "Model": "gemma4:latest"
  }
}
```

Si Ollama no estÃ¡ abierto o no responde, el backend devuelve un anÃ¡lisis local y la aplicaciÃ³n continÃºa funcionando.

## Estructura del Proyecto

```text
payment-management/
|
â”œâ”€â”€ backend/
|   â”œâ”€â”€ Controllers/
|   â”œâ”€â”€ PaymentManagement.Business/
|   |   â”œâ”€â”€ Businesses/
|   |   â”œâ”€â”€ DTOs/
|   |   â””â”€â”€ Interfaces/
|   â”œâ”€â”€ PaymentManagement.Repository/
|   |   â”œâ”€â”€ Data/
|   |   â”œâ”€â”€ Interfaces/
|   |   â”œâ”€â”€ Models/
|   |   â””â”€â”€ Repositories/
|   â”œâ”€â”€ database/
|   |   â””â”€â”€ postgresql-schema.sql
|   â”œâ”€â”€ Program.cs
|   â”œâ”€â”€ appsettings.json
|   â””â”€â”€ PaymentManagement.sln
|
â”œâ”€â”€ en-que-se-fue/
|   â”œâ”€â”€ src/
|   |   â”œâ”€â”€ app/
|   |   |   â”œâ”€â”€ core/
|   |   |   â”œâ”€â”€ features/
|   |   |   â””â”€â”€ layout/
|   |   â”œâ”€â”€ assets/
|   |   â””â”€â”€ environments/
|   â”œâ”€â”€ angular.json
|   â”œâ”€â”€ package.json
|   â””â”€â”€ tsconfig.json
|
â””â”€â”€ README.md
```

## Funcionalidades Principales

### AutenticaciÃ³n

- Registro de usuarios.
- Inicio de sesiÃ³n.
- Cierre de sesiÃ³n.
- EdiciÃ³n de perfil.
- SeparaciÃ³n de datos por usuario.

### Dashboard

- Total gastado del mes.
- Gasto mÃ¡s alto.
- CategorÃ­a principal.
- Presupuesto restante.
- GrÃ¡fico de torta por categorÃ­a.
- LÃ­nea de evoluciÃ³n mensual.
- Barras por mÃ©todo de pago.
- ComparaciÃ³n entre gastos fijos y variables.
- Ãšltimos gastos registrados.
- Campana de notificaciones.
- AnÃ¡lisis inteligente del perÃ­odo.

### Gastos

- Crear, editar y eliminar gastos.
- Registrar descripciÃ³n, monto, fecha, categorÃ­a, mÃ©todo de pago y notas.
- Vista en lista.
- Vista en calendario.
- Ordenamiento por descripciÃ³n, categorÃ­a, mÃ©todo, tipo, fecha y monto.
- Filtro por categorÃ­a.
- BÃºsqueda por descripciÃ³n.
- BotÃ³n para restablecer ordenamientos.

### CategorÃ­as

- Crear, editar y eliminar categorÃ­as.
- Asignar colores personalizados.
- Guardar colores creados para volver a utilizarlos.
- Agregar descripciÃ³n opcional.
- Ver estadÃ­sticas de uso por categorÃ­a.

### Presupuestos

- Cargar mÃºltiples presupuestos dentro de un mismo mes.
- Registrar origen de los fondos.
- Editar y eliminar presupuestos.
- Visualizar total presupuestado, total gastado y presupuesto restante.
- Filtrar presupuestos por mes o ver todos.

### PlanificaciÃ³n

- Definir meta de ahorro mensual.
- Crear lÃ­mites por categorÃ­a.
- Crear alertas personalizadas.
- Administrar gastos recurrentes.
- Crear gastos recurrentes para el mes seleccionado.
- Seleccionar mes y aÃ±o de planificaciÃ³n.

### AnÃ¡lisis Inteligente

- Generar un resumen del estado financiero mensual.
- Obtener recomendaciones de mejora.
- Utilizar Ollama de forma local.
- Mantener un resumen local si la IA no estÃ¡ disponible.

### Modo Oscuro

- La aplicaciÃ³n cuenta con modo claro y modo oscuro.
- El login y el registro permanecen siempre en modo claro.
- Al cerrar sesiÃ³n, el sistema vuelve al modo claro por defecto.

## Usuario y ContraseÃ±a de Prueba

El proyecto permite crear usuarios desde la pantalla de registro.

Usuario de prueba sugerido:

```text
Email: leandro@test.com
ContraseÃ±a: 123456
```

Si el usuario no existe en la base de datos, puede crearse desde la opciÃ³n `Crear cuenta` en la pantalla de login.

## Notas Importantes

- El backend debe estar ejecutÃ¡ndose antes de usar el frontend.
- La base de datos PostgreSQL debe estar creada previamente.
- Ollama es opcional.
- Si Ollama no estÃ¡ disponible, la aplicaciÃ³n continÃºa funcionando con anÃ¡lisis local.
- Las carpetas `bin`, `obj`, `dist`, `.angular`, `node_modules` y `artifacts` no deben subirse a GitHub.

