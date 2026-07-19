# ¿En Qué Se Fue?

¿En Qué Se Fue? es una aplicación web para administrar gastos personales, presupuestos, categorías, alertas y planificación mensual. El objetivo del proyecto es ayudar al usuario a registrar sus movimientos, entender en qué se fue su dinero y tomar mejores decisiones sobre sus gastos.

La aplicación cuenta con autenticación de usuarios, por lo que cada persona puede tener sus propios datos separados dentro del sistema.

## Descripción General

El sistema permite registrar gastos, organizarlos por categorías, cargar presupuestos mensuales, definir metas de ahorro y revisar un dashboard con información resumida de la situación financiera del usuario.

También incluye una sección de análisis inteligente. En entorno local puede utilizar Ollama como IA local. En producción web, si Ollama no está disponible, el backend genera un análisis local de respaldo para mantener la aplicación funcional sin depender de servicios pagos.

## URLs del Proyecto

- Frontend publicado: https://enquesefue.netlify.app
- Backend publicado: https://en-que-se-fue-backend.onrender.com
- Repositorio GitHub: https://github.com/Lean501/en-que-se-fue

## Stack Tecnológico

### Frontend

- Angular 18
- TypeScript
- HTML
- CSS
- RxJS
- Netlify para despliegue web
- LocalStorage para sesión y preferencias visuales

### Backend

- .NET 10
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- Npgsql Entity Framework Core Provider
- Docker
- Render para despliegue web
- Arquitectura por capas:
  - API
  - Business
  - Repository

### Base de Datos

- PostgreSQL
- Neon PostgreSQL para producción
- Script SQL incluido en el proyecto para crear las tablas

### Inteligencia Artificial

- Ollama local opcional
- Modelo configurable desde `appsettings.json`
- Análisis local automático cuando Ollama no está disponible

## Instalación y Ejecución Local

### Requisitos Previos

Antes de ejecutar el proyecto, es necesario tener instalado:

- Node.js
- Angular CLI
- .NET 10 SDK
- PostgreSQL
- pgAdmin, DBeaver o cualquier cliente compatible con PostgreSQL
- Ollama, opcional para usar el análisis inteligente con IA local

## Configuración de la Base de Datos

### PostgreSQL local

1. Instalar PostgreSQL.
2. Crear una base de datos llamada:

```text
PaymentManagementDb
```

3. Ejecutar el script ubicado en:

```text
en-que-se-fue-backend/database/postgresql-schema.sql
```

4. Revisar la cadena de conexión del backend en `appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=PaymentManagementDb;Username=postgres;Password=postgres"
  }
}
```

Si el usuario o contraseña de PostgreSQL son diferentes, se deben modificar en esa cadena de conexión.

### PostgreSQL online

En producción se usa Neon PostgreSQL. La cadena de conexión se configura como variable de entorno del backend publicado.

Variables soportadas por el backend:

```text
DATABASE_URL
NETLIFY_DB_URL
NETLIFY_DATABASE_URL
```

## Ejecución del Backend

Desde una terminal, ingresar a la carpeta del backend:

```bash
cd en-que-se-fue-backend
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

## Ejecución del Frontend

Desde otra terminal, ingresar a la carpeta del frontend:

```bash
cd en-que-se-fue-front
```

Instalar las dependencias:

```bash
npm install
```

Ejecutar la aplicación:

```bash
npm start
```

La aplicación queda disponible en:

```text
http://localhost:4200
```

## Configuración Opcional de Ollama

Ollama se utiliza únicamente como IA local. Para usarlo:

1. Instalar Ollama.
2. Descargar un modelo local, por ejemplo:

```bash
ollama pull gemma4
```

3. Verificar que Ollama esté ejecutándose:

```bash
ollama list
```

4. Revisar la configuración del backend en `appsettings.json`:

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

En producción web gratuita no se ejecuta Ollama en el servidor. Si Ollama no está disponible, el backend devuelve un análisis local de respaldo y la aplicación continúa funcionando.

## Despliegue

### Frontend

El frontend está desplegado en Netlify.

Configuración de build:

```text
Base directory: en-que-se-fue-front
Build command: npm run build
Publish directory: dist/en-que-se-fue/browser
```

La configuración también está definida en `netlify.toml`.

### Backend

El backend está desplegado en Render como servicio Docker.

Configuración principal:

```text
Root directory: en-que-se-fue-backend
Runtime: Docker
Dockerfile path: ./Dockerfile
```

Variable de entorno necesaria:

```text
DATABASE_URL=postgresql://usuario:password@host/database?sslmode=require
```

La API permite CORS desde:

```text
http://localhost:4200
https://enquesefue.netlify.app
```

### Base de Datos

La base de datos de producción está alojada en Neon PostgreSQL. Las tablas se crean ejecutando el script:

```text
en-que-se-fue-backend/database/postgresql-schema.sql
```

## Estructura del Proyecto

```text
payment-management/
|
├── en-que-se-fue-backend/
|   ├── Controllers/
|   ├── PaymentManagement.Business/
|   |   ├── Businesses/
|   |   ├── DTOs/
|   |   └── Interfaces/
|   ├── PaymentManagement.Repository/
|   |   ├── Data/
|   |   ├── Interfaces/
|   |   ├── Models/
|   |   └── Repositories/
|   ├── database/
|   |   └── postgresql-schema.sql
|   ├── Dockerfile
|   ├── Program.cs
|   ├── appsettings.json
|   └── PaymentManagement.sln
|
├── en-que-se-fue-front/
|   ├── src/
|   |   ├── app/
|   |   |   ├── core/
|   |   |   ├── features/
|   |   |   └── layout/
|   |   ├── assets/
|   |   └── environments/
|   ├── angular.json
|   ├── package.json
|   └── tsconfig.json
|
├── netlify.toml
├── .gitignore
└── README.md
```

## Funcionalidades Principales

### Autenticación

- Registro de usuarios.
- Inicio de sesión.
- Cierre de sesión.
- Edición de perfil.
- Separación de datos por usuario.

### Dashboard

- Total gastado del mes.
- Gasto más alto.
- Categoría principal.
- Presupuesto restante.
- Gráfico de torta por categoría.
- Línea de evolución mensual.
- Barras por método de pago.
- Comparación entre gastos fijos y variables.
- Últimos gastos registrados.
- Campana de notificaciones.
- Análisis inteligente del período.

### Gastos

- Crear, editar y eliminar gastos.
- Registrar descripción, monto, fecha, categoría, método de pago y notas.
- Vista en lista.
- Vista en calendario.
- Ordenamiento por descripción, categoría, método, tipo, fecha y monto.
- Filtro por categoría.
- Búsqueda por descripción.
- Botón para restablecer ordenamientos.

### Categorías

- Crear, editar y eliminar categorías.
- Asignar colores personalizados.
- Guardar colores creados para volver a utilizarlos.
- Agregar descripción opcional.
- Ver estadísticas de uso por categoría.

### Presupuestos

- Cargar múltiples presupuestos dentro de un mismo mes.
- Registrar origen de los fondos.
- Editar y eliminar presupuestos.
- Visualizar total presupuestado, total gastado y presupuesto restante.
- Filtrar presupuestos por mes o ver todos.

### Planificación

- Definir meta de ahorro mensual.
- Crear límites por categoría.
- Crear alertas personalizadas.
- Administrar gastos recurrentes.
- Crear gastos recurrentes para el mes seleccionado.
- Seleccionar mes y año de planificación.

### Análisis Inteligente

- Generar un resumen del estado financiero mensual.
- Obtener recomendaciones de mejora.
- Utilizar Ollama de forma local.
- Mantener un resumen local si la IA no está disponible.

### Modo Oscuro

- La aplicación cuenta con modo claro y modo oscuro.
- El login y el registro permanecen siempre en modo claro.
- Al cerrar sesión, el sistema vuelve al modo claro por defecto.

## Usuario y Contraseña de Prueba

Usuario de prueba con datos cargados:

```text
Email: enQueSeFue@test.com
Contraseña: 123456
```

El usuario de prueba incluye datos de ejemplo inspirados en gastos cotidianos de España:

- Alquiler de piso compartido en Madrid.
- Compra semanal en Mercadona.
- Abono transporte de Madrid.
- Factura de móvil e internet.
- Café y tostada en cafetería.
- Compra en farmacia de Gran Vía.
- Tapas con amigos.
- Compra rápida en Carrefour Express.
- Presupuesto mensual cargado desde nómina y un ingreso freelance.

## Notas Importantes

- El backend debe estar ejecutándose antes de usar el frontend en local.
- La base de datos PostgreSQL debe estar creada previamente.
- Ollama es opcional y está pensado para entorno local.
- En producción web gratuita, el análisis inteligente utiliza el fallback local del backend si Ollama no está disponible.
- Render puede tardar unos segundos en responder la primera vez porque el servicio gratuito puede quedar en reposo.