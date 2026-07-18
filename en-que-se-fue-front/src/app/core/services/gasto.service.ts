import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { map } from "rxjs"
import type { Observable } from "rxjs"
import { environment } from "../../../environments/environment"
import type { Gasto, GastoInput } from "../models/gasto.model"

@Injectable({ providedIn: "root" })
export class GastoService {
  private readonly api = `${environment.apiUrl}/gastos`

  constructor(private http: HttpClient) {}

  listar(): Observable<Gasto[]> {
    return this.http.get<ApiGasto[]>(this.api).pipe(
      map((gastos) => gastos.map(this.fromApi)),
    )
  }

  obtener(id: string): Observable<Gasto> {
    return this.http.get<ApiGasto>(`${this.api}/${id}`).pipe(map(this.fromApi))
  }

  crear(data: GastoInput): Observable<Gasto> {
    return this.http.post<ApiGasto>(this.api, this.toApi(data)).pipe(map(this.fromApi))
  }

  actualizar(id: string, data: GastoInput): Observable<Gasto> {
    return this.http.put<ApiGasto>(`${this.api}/${id}`, this.toApi(data)).pipe(map(this.fromApi))
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`)
  }

  private fromApi(gasto: ApiGasto): Gasto {
    return {
      id: String(gasto.id),
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha.slice(0, 10),
      categoriaId: String(gasto.categoriaId),
      metodoPago: gasto.metodoPago ?? "tarjeta",
      tipoMonto: gasto.tipoMonto ?? "variable",
      notas: gasto.notas ?? "",
    }
  }

  private toApi(gasto: GastoInput): ApiGastoInput {
    return {
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      categoriaId: Number(gasto.categoriaId),
      categoriaNombre: "",
      metodoPago: gasto.metodoPago,
      tipoMonto: gasto.tipoMonto,
      notas: gasto.notas,
    }
  }
}

interface ApiGasto {
  id: number
  descripcion: string
  monto: number
  fecha: string
  categoriaId: number
  categoriaNombre: string
  metodoPago: "efectivo" | "tarjeta" | "transferencia"
  tipoMonto: "fijo" | "variable"
  notas?: string
}

type ApiGastoInput = Omit<ApiGasto, "id">
