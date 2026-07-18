import { Injectable } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { type Observable, forkJoin, map, switchMap } from "rxjs"
import { environment } from "../../../environments/environment"
import type { Categoria } from "../models/categoria.model"
import type { Gasto } from "../models/gasto.model"
import type { CategoriaResumen, ResumenMensual } from "../models/resumen.model"
import { CategoriaService } from "./categoria.service"
import { GastoService } from "./gasto.service"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

@Injectable({ providedIn: "root" })
export class ResumenService {
  private readonly api = `${environment.apiUrl}/resumenmensual`

  constructor(
    private http: HttpClient,
    private gastoService: GastoService,
    private categoriaService: CategoriaService,
  ) {}

  /** periodo: formato "YYYY-MM" */
  generar(periodo: string): Observable<ResumenMensual> {
    return forkJoin({
      gastos: this.gastoService.listar(),
      categorias: this.categoriaService.listar(),
    }).pipe(
      switchMap(({ gastos, categorias }) =>
        this.http.post<ApiResumenMensual>(this.api, this.toApiRequest(periodo, gastos, categorias)).pipe(
          map((response) => this.fromApi(periodo, response, gastos, categorias)),
        ),
      ),
    )
  }

  generarConDatos(periodoLabel: string, gastos: Gasto[], categorias: Categoria[]): Observable<ResumenMensual> {
    return this.http.post<ApiResumenMensual>(this.api, {
      mes: 0,
      anio: 0,
      todosLosGastos: true,
      gastos: this.toApiGastos(gastos, categorias),
    }).pipe(
      map((response) => this.fromApi(periodoLabel, response, gastos, categorias)),
    )
  }

  listarPeriodosDisponibles(gastos: Gasto[]): string[] {
    const set = new Set(gastos.map((g) => g.fecha.slice(0, 7)))
    return Array.from(set).sort().reverse()
  }

  private toApiRequest(periodo: string, gastos: Gasto[], categorias: Categoria[]): ApiResumenMensualRequest {
    const todosLosGastos = periodo === "todos"
    const [anio, mes] = todosLosGastos ? [0, 0] : periodo.split("-").map(Number)
    const catMap = new Map(categorias.map((categoria) => [categoria.id, categoria]))

    return {
      mes,
      anio,
      todosLosGastos,
      gastos: gastos.map((gasto) => ({
        ...this.toApiGasto(gasto, catMap),
      })),
    }
  }

  private toApiGastos(gastos: Gasto[], categorias: Categoria[]): ApiGasto[] {
    const catMap = new Map(categorias.map((categoria) => [categoria.id, categoria]))
    return gastos.map((gasto) => this.toApiGasto(gasto, catMap))
  }

  private toApiGasto(gasto: Gasto, catMap: Map<string, Categoria>): ApiGasto {
    return {
      id: Number(gasto.id),
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      fecha: gasto.fecha,
      categoriaId: Number(gasto.categoriaId),
      categoriaNombre: catMap.get(gasto.categoriaId)?.nombre ?? "Sin categoría",
    }
  }

  private fromApi(
    periodo: string,
    response: ApiResumenMensual,
    gastos: Gasto[],
    categorias: Categoria[],
  ): ResumenMensual {
    const delMes = periodo === "todos" ? gastos : gastos.filter((gasto) => gasto.fecha.startsWith(periodo))
    const totalGastado = response.totalGastado
    const cantidadGastos = delMes.length
    const promedioPorGasto = cantidadGastos ? totalGastado / cantidadGastos : 0
    const categoriasResumen = this.buildCategoriasResumen(delMes, categorias, totalGastado)
    const categoriaTop = categoriasResumen[0] ?? null

    return {
      periodo,
      periodoLabel: this.formatearPeriodo(periodo),
      totalGastado,
      cantidadGastos,
      promedioPorGasto,
      categoriaTop,
      categorias: categoriasResumen,
      observaciones: [response.resumen],
      recomendaciones: response.recomendaciones,
      variacionMesAnterior: null,
    }
  }

  private buildCategoriasResumen(gastos: Gasto[], categorias: Categoria[], totalGastado: number): CategoriaResumen[] {
    const catMap = new Map(categorias.map((categoria) => [categoria.id, categoria]))
    const porCategoria = new Map<string, CategoriaResumen>()

    for (const gasto of gastos) {
      const categoria = catMap.get(gasto.categoriaId)
      const actual = porCategoria.get(gasto.categoriaId)

      if (actual) {
        actual.total += gasto.monto
        actual.cantidad += 1
        continue
      }

      porCategoria.set(gasto.categoriaId, {
        categoriaId: gasto.categoriaId,
        nombre: categoria?.nombre ?? "Sin categoría",
        color: categoria?.color ?? "#98a2b3",
        total: gasto.monto,
        cantidad: 1,
        porcentaje: 0,
      })
    }

    return Array.from(porCategoria.values())
      .map((categoria) => ({
        ...categoria,
        porcentaje: totalGastado ? (categoria.total / totalGastado) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
  }

  private formatearPeriodo(periodo: string): string {
    if (periodo === "todos") {
      return "todos los gastos"
    }

    const [y, m] = periodo.split("-").map(Number)
    return `${MESES[m - 1]} ${y}`
  }
}

interface ApiResumenMensualRequest {
  mes: number
  anio: number
  todosLosGastos: boolean
  gastos: ApiGasto[]
}

interface ApiGasto {
  id: number
  descripcion: string
  monto: number
  fecha: string
  categoriaId: number
  categoriaNombre: string
}

interface ApiResumenMensual {
  totalGastado: number
  categoriaMayorGasto: string
  gastosMasImportantes: ApiGasto[]
  recomendaciones: string[]
  resumen: string
}
