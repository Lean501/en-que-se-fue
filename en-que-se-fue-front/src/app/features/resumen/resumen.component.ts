import { Component, type OnInit, computed, inject, signal } from "@angular/core"
import { CurrencyPipe, DecimalPipe } from "@angular/common"
import { ResumenService } from "../../core/services/resumen.service"
import { GastoService } from "../../core/services/gasto.service"
import { CategoriaService } from "../../core/services/categoria.service"
import type { ResumenMensual } from "../../core/models/resumen.model"
import type { Gasto } from "../../core/models/gasto.model"
import type { Categoria } from "../../core/models/categoria.model"
import { DATE_FILTER_OPTIONS, filterGastosByDate, toDateInput, type DateFilterKey } from "../../core/utils/date-filter"

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

@Component({
  selector: "app-resumen",
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: "./resumen.component.html",
  styleUrl: "./resumen.component.css",
})
export class ResumenComponent implements OnInit {
  private resumenService = inject(ResumenService)
  private gastoService = inject(GastoService)
  private categoriaService = inject(CategoriaService)

  readonly periodos = signal<string[]>([])
  readonly periodoSel = signal<string>("todos")
  readonly resumen = signal<ResumenMensual | null>(null)
  readonly analizando = signal(false)
  readonly gastos = signal<Gasto[]>([])
  readonly categorias = signal<Categoria[]>([])
  readonly filtroFecha = signal<DateFilterKey>("mes")
  readonly fechaDesde = signal(toDateInput(new Date()))
  readonly fechaHasta = signal(toDateInput(new Date()))
  readonly filtrosFecha = DATE_FILTER_OPTIONS

  readonly gastosFiltrados = computed(() =>
    filterGastosByDate(this.gastos(), {
      key: this.filtroFecha(),
      desde: this.fechaDesde(),
      hasta: this.fechaHasta(),
    }),
  )

  readonly gastosPorMes = computed(() => {
    const meses = new Map<string, number>()
    for (const gasto of this.gastos()) {
      const key = gasto.fecha.slice(0, 7)
      meses.set(key, (meses.get(key) ?? 0) + gasto.monto)
    }
    return [...meses.entries()].sort().slice(-6).map(([periodo, total]) => ({ periodo, total }))
  })

  readonly totalMaximoMes = computed(() => Math.max(...this.gastosPorMes().map((item) => item.total), 1))

  readonly gastosPorMetodo = computed(() => {
    const map = new Map<string, number>()
    for (const gasto of this.gastosFiltrados()) {
      map.set(gasto.metodoPago, (map.get(gasto.metodoPago) ?? 0) + gasto.monto)
    }
    return [...map.entries()].map(([metodo, total]) => ({ metodo, total }))
  })

  readonly totalMaximoMetodo = computed(() => Math.max(...this.gastosPorMetodo().map((item) => item.total), 1))

  ngOnInit(): void {
    this.analizando.set(true)
    this.gastoService.listar().subscribe((gastos) => {
      this.categoriaService.listar().subscribe((categorias) => {
        this.gastos.set(gastos)
        this.categorias.set(categorias)
        const periodos = this.resumenService.listarPeriodosDisponibles(gastos)
        this.periodos.set(["todos", ...(periodos.length ? periodos : [this.mesActual()])])
        this.generar()
      })
    })
  }

  cambiarPeriodo(periodo: string): void {
    this.periodoSel.set(periodo)
    this.generar()
  }

  generar(): void {
    this.analizando.set(true)
    this.resumen.set(null)
    const gastos = this.filtroFecha() === "todos"
      ? this.gastos()
      : this.gastosFiltrados()
    const label = this.etiquetaFiltro()

    this.resumenService.generarConDatos(label, gastos, this.categorias()).subscribe({
      next: (r) => {
        this.resumen.set(r)
        this.analizando.set(false)
      },
      error: () => this.analizando.set(false),
    })
  }

  etiquetaPeriodo(periodo: string): string {
    if (periodo === "todos") {
      return "Todos los gastos"
    }

    const [y, m] = periodo.split("-").map(Number)
    return `${MESES[m - 1]} ${y}`
  }

  cambiarFiltroFecha(filtro: DateFilterKey): void {
    this.filtroFecha.set(filtro)
    this.generar()
  }

  etiquetaFiltro(): string {
    const filtro = this.filtrosFecha.find((item) => item.value === this.filtroFecha())
    return filtro?.label ?? "Gastos filtrados"
  }

  pieGradient(resumen: ResumenMensual): string {
    let acumulado = 0
    const partes = resumen.categorias.map((categoria) => {
      const inicio = acumulado
      acumulado += categoria.porcentaje
      return `${categoria.color} ${inicio}% ${acumulado}%`
    })
    return `conic-gradient(${partes.join(", ")})`
  }

  private mesActual(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
  }
}
