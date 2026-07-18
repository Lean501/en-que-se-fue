import type { HttpInterceptorFn, HttpEvent } from "@angular/common/http"
import { HttpResponse, HttpErrorResponse } from "@angular/common/http"
import { type Observable, of, throwError, delay, mergeMap } from "rxjs"
import { environment } from "../../../environments/environment"
import type { Categoria } from "../models/categoria.model"
import type { Gasto } from "../models/gasto.model"
import type { Usuario } from "../models/usuario.model"

/**
 * Backend REST simulado en memoria.
 * Intercepta las llamadas a `${apiUrl}` y responde con datos persistidos en
 * localStorage, imitando un API real (GET/POST/PUT/DELETE).
 *
 * Para usar tu backend real: pon environment.useMockApi = false
 * (y elimina este interceptor de app.config.ts).
 */

const DB_CATEGORIAS = "mock_categorias"
const DB_GASTOS = "mock_gastos"

const USUARIO_DEMO: Usuario = { id: "u1", nombre: "Ana Torres", email: "admin@pagos.com" }
const PASSWORD_DEMO = "123456"

function uid(): string {
  return Math.random().toString(36).slice(2, 10)
}

function seed(): void {
  if (!localStorage.getItem(DB_CATEGORIAS)) {
    const categorias: Categoria[] = [
      { id: "c1", nombre: "Alimentación", color: "#1f6f5c", descripcion: "Supermercado y comidas" },
      { id: "c2", nombre: "Transporte", color: "#2563eb", descripcion: "Combustible y viajes" },
      { id: "c3", nombre: "Servicios", color: "#b54708", descripcion: "Luz, agua, internet" },
      { id: "c4", nombre: "Ocio", color: "#9333ea", descripcion: "Entretenimiento" },
      { id: "c5", nombre: "Salud", color: "#d92d20", descripcion: "Farmacia y consultas" },
    ]
    localStorage.setItem(DB_CATEGORIAS, JSON.stringify(categorias))
  }
  if (!localStorage.getItem(DB_GASTOS)) {
    const hoy = new Date()
    const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`
    const prev = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
    const mesPrev = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`
    const gastos: Gasto[] = [
      { id: uid(), descripcion: "Compra semanal", monto: 85, fecha: `${mesActual}-03`, categoriaId: "c1", metodoPago: "tarjeta", tipoMonto: "variable" },
      { id: uid(), descripcion: "Nafta", monto: 60, fecha: `${mesActual}-05`, categoriaId: "c2", metodoPago: "tarjeta", tipoMonto: "variable" },
      { id: uid(), descripcion: "Internet", monto: 40, fecha: `${mesActual}-08`, categoriaId: "c3", metodoPago: "transferencia", tipoMonto: "fijo" },
      { id: uid(), descripcion: "Cine", monto: 25, fecha: `${mesActual}-10`, categoriaId: "c4", metodoPago: "efectivo", tipoMonto: "variable" },
      { id: uid(), descripcion: "Café", monto: 6, fecha: `${mesActual}-11`, categoriaId: "c4", metodoPago: "efectivo", tipoMonto: "variable" },
      { id: uid(), descripcion: "Farmacia", monto: 32, fecha: `${mesActual}-14`, categoriaId: "c5", metodoPago: "tarjeta", tipoMonto: "variable" },
      { id: uid(), descripcion: "Restaurante", monto: 54, fecha: `${mesActual}-16`, categoriaId: "c1", metodoPago: "tarjeta", tipoMonto: "variable" },
      { id: uid(), descripcion: "Café", monto: 5, fecha: `${mesActual}-18`, categoriaId: "c4", metodoPago: "efectivo", tipoMonto: "variable" },
      { id: uid(), descripcion: "Supermercado", monto: 120, fecha: `${mesPrev}-06`, categoriaId: "c1", metodoPago: "tarjeta", tipoMonto: "variable" },
      { id: uid(), descripcion: "Luz", monto: 70, fecha: `${mesPrev}-12`, categoriaId: "c3", metodoPago: "transferencia", tipoMonto: "fijo" },
    ]
    localStorage.setItem(DB_GASTOS, JSON.stringify(gastos))
  }
}

function read<T>(key: string): T[] {
  return JSON.parse(localStorage.getItem(key) ?? "[]") as T[]
}
function write<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}

function ok<T>(body: T): Observable<HttpEvent<T>> {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(300))
}
function fail(status: number, message: string): Observable<never> {
  return throwError(() => new HttpErrorResponse({ status, error: { message } })).pipe(delay(300)) as Observable<never>
}

export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.useMockApi || !req.url.startsWith(environment.apiUrl)) {
    return next(req)
  }
  seed()

  const url = req.url.replace(environment.apiUrl, "")
  const { method, body } = req

  return of(null).pipe(
    mergeMap(() => handle(url, method, body)),
  )
}

function handle(url: string, method: string, body: unknown): Observable<HttpEvent<unknown>> {
  // AUTH
  if (url === "/auth/login" && method === "POST") {
    const { email, password } = (body ?? {}) as { email: string; password: string }
    if (email === USUARIO_DEMO.email && password === PASSWORD_DEMO) {
      return ok({ token: "mock-jwt-" + uid(), usuario: USUARIO_DEMO })
    }
    return fail(401, "Credenciales inválidas")
  }

  // CATEGORIAS
  if (url === "/categorias" && method === "GET") {
    return ok(read<Categoria>(DB_CATEGORIAS))
  }
  if (url === "/categorias" && method === "POST") {
    const items = read<Categoria>(DB_CATEGORIAS)
    const nueva: Categoria = { ...(body as Categoria), id: uid() }
    items.push(nueva)
    write(DB_CATEGORIAS, items)
    return ok(nueva)
  }
  if (url.startsWith("/categorias/")) {
    const id = url.split("/")[2]
    const items = read<Categoria>(DB_CATEGORIAS)
    const idx = items.findIndex((c) => c.id === id)
    if (method === "GET") {
      return idx >= 0 ? ok(items[idx]) : fail(404, "Categoria no encontrada")
    }
    if (method === "PUT") {
      if (idx < 0) return fail(404, "Categoria no encontrada")
      items[idx] = { ...(body as Categoria), id }
      write(DB_CATEGORIAS, items)
      return ok(items[idx])
    }
    if (method === "DELETE") {
      // impide borrar categoria con gastos asociados
      const gastos = read<Gasto>(DB_GASTOS)
      if (gastos.some((g) => g.categoriaId === id)) {
        return fail(409, "No se puede eliminar: la categoria tiene gastos asociados")
      }
      write(DB_CATEGORIAS, items.filter((c) => c.id !== id))
      return ok(null)
    }
  }

  // GASTOS
  if (url === "/gastos" && method === "GET") {
    return ok(read<Gasto>(DB_GASTOS))
  }
  if (url === "/gastos" && method === "POST") {
    const items = read<Gasto>(DB_GASTOS)
    const nuevo: Gasto = { ...(body as Gasto), id: uid() }
    items.push(nuevo)
    write(DB_GASTOS, items)
    return ok(nuevo)
  }
  if (url.startsWith("/gastos/")) {
    const id = url.split("/")[2]
    const items = read<Gasto>(DB_GASTOS)
    const idx = items.findIndex((g) => g.id === id)
    if (method === "GET") {
      return idx >= 0 ? ok(items[idx]) : fail(404, "Gasto no encontrado")
    }
    if (method === "PUT") {
      if (idx < 0) return fail(404, "Gasto no encontrado")
      items[idx] = { ...(body as Gasto), id }
      write(DB_GASTOS, items)
      return ok(items[idx])
    }
    if (method === "DELETE") {
      write(DB_GASTOS, items.filter((g) => g.id !== id))
      return ok(null)
    }
  }

  return fail(404, `Ruta no encontrada: ${method} ${url}`)
}
