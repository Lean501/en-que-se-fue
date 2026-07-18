import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import type { Observable } from "rxjs"
import { environment } from "../../../environments/environment"
import type { AnalisisInteligente } from "../models/analisis.model"

@Injectable({ providedIn: "root" })
export class AnalisisService {
  private readonly api = `${environment.apiUrl}/analisis`

  constructor(private http: HttpClient) {}

  obtenerDashboard(mes?: number, anio?: number): Observable<AnalisisInteligente> {
    const params: Record<string, string> = {}
    if (mes) params["mes"] = String(mes)
    if (anio) params["anio"] = String(anio)

    return this.http.get<AnalisisInteligente>(`${this.api}/dashboard`, { params })
  }
}
