import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { map } from "rxjs"
import type { Observable } from "rxjs"
import { environment } from "../../../environments/environment"
import type { PresupuestoMensual, PresupuestoMensualInput } from "../models/presupuesto.model"

@Injectable({ providedIn: "root" })
export class PresupuestoService {
  private readonly api = `${environment.apiUrl}/presupuestos`

  constructor(private http: HttpClient) {}

  listar(): Observable<PresupuestoMensual[]> {
    return this.http.get<ApiPresupuestoMensual[]>(this.api).pipe(
      map((presupuestos) => presupuestos.map(this.fromApi)),
    )
  }

  guardar(data: PresupuestoMensualInput): Observable<PresupuestoMensual> {
    return this.http.post<ApiPresupuestoMensual>(this.api, data).pipe(map(this.fromApi))
  }

  actualizar(id: string, data: PresupuestoMensualInput): Observable<PresupuestoMensual> {
    return this.http.put<ApiPresupuestoMensual>(`${this.api}/${id}`, data).pipe(map(this.fromApi))
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`)
  }

  private fromApi(presupuesto: ApiPresupuestoMensual): PresupuestoMensual {
    return {
      ...presupuesto,
      id: String(presupuesto.id),
    }
  }
}

interface ApiPresupuestoMensual {
  id: number
  mes: number
  anio: number
  monto: number
  origenFondos?: string
}
