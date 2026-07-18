import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { map } from "rxjs"
import type { Observable } from "rxjs"
import { environment } from "../../../environments/environment"
import type { Categoria, CategoriaInput } from "../models/categoria.model"

@Injectable({ providedIn: "root" })
export class CategoriaService {
  private readonly api = `${environment.apiUrl}/categorias`

  constructor(private http: HttpClient) {}

  listar(): Observable<Categoria[]> {
    return this.http.get<ApiCategoria[]>(this.api).pipe(
      map((categorias) => categorias.map(this.fromApi)),
    )
  }

  obtener(id: string): Observable<Categoria> {
    return this.http.get<ApiCategoria>(`${this.api}/${id}`).pipe(map(this.fromApi))
  }

  crear(data: CategoriaInput): Observable<Categoria> {
    return this.http.post<ApiCategoria>(this.api, data).pipe(map(this.fromApi))
  }

  actualizar(id: string, data: CategoriaInput): Observable<Categoria> {
    return this.http.put<ApiCategoria>(`${this.api}/${id}`, data).pipe(map(this.fromApi))
  }

  eliminar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`)
  }

  private fromApi(categoria: ApiCategoria): Categoria {
    return {
      ...categoria,
      id: String(categoria.id),
    }
  }
}

interface ApiCategoria {
  id: number
  nombre: string
  color: string
  descripcion?: string
}
