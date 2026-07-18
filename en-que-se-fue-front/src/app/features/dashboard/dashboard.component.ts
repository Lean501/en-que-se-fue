import { CurrencyPipe, DatePipe, DecimalPipe } from "@angular/common"
import { Component, type OnInit, computed, inject, signal } from "@angular/core"
import { forkJoin } from "rxjs"
import { CategoriaService } from "../../core/services/categoria.service"
import { GastoService } from "../../core/services/gasto.service"
import { PresupuestoService } from "../../core/services/presupuesto.service"
import { PlanningService } from "../../core/services/planning.service"
import { NotificationService } from "../../core/services/notification.service"
import { AnalisisService } from "../../core/services/analisis.service"
import type { Categoria } from "../../core/models/categoria.model"
import type { Gasto } from "../../core/models/gasto.model"
import type { PresupuestoMensual } from "../../core/models/presupuesto.model"
import type { AnalisisInteligente } from "../../core/models/analisis.model"

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.css",
})
export class DashboardComponent implements OnInit {
  private readonly themeKey = "pagos_admin_theme"
  private gastoService = inject(GastoService)
  private categoriaService = inject(CategoriaService)
  private presupuestoService = inject(PresupuestoService)
  private planningService = inject(PlanningService)
  private notificationService = inject(NotificationService)
  private analisisService = inject(AnalisisService)

  readonly gastos = signal<Gasto[]>([])
  readonly categorias = signal<Categoria[]>([])
  readonly presupuestos = signal<PresupuestoMensual[]>([])
  readonly analisis = signal<AnalisisInteligente | null>(null)
  readonly cargando = signal(true)
  readonly cargandoAnalisis = signal(false)
  readonly modoOscuro = signal(this.restoreTheme())
  readonly metas = this.planningService.metas
  readonly limitesCategoria = this.planningService.limites
  readonly alertasPersonalizadas = this.planningService.alertasPersonalizadas

  private readonly ahora = new Date()
  private readonly mesActual = this.ahora.getMonth() + 1
  private readonly anioActual = this.ahora.getFullYear()

  private readonly gastosMesActual = computed(() =>
    this.gastos().filter((gasto) => {
      const fecha = new Date(`${gasto.fecha}T00:00:00`)
      return fecha.getMonth() + 1 === this.mesActual && fecha.getFullYear() === this.anioActual
    }),
  )

  private readonly gastosMesAnterior = computed(() => {
    const fechaBase = new Date(this.anioActual, this.mesActual - 2, 1)
    return this.gastos().filter((gasto) => {
      const fecha = new Date(`${gasto.fecha}T00:00:00`)
      return fecha.getMonth() === fechaBase.getMonth() && fecha.getFullYear() === fechaBase.getFullYear()
    })
  })

  readonly totalMes = computed(() => this.gastosMesActual().reduce((total, gasto) => total + gasto.monto, 0))
  readonly totalFijoMes = computed(() =>
    this.gastosMesActual()
      .filter((gasto) => gasto.tipoMonto === "fijo")
      .reduce((total, gasto) => total + gasto.monto, 0),
  )
  readonly totalVariableMes = computed(() =>
    this.gastosMesActual()
      .filter((gasto) => gasto.tipoMonto !== "fijo")
      .reduce((total, gasto) => total + gasto.monto, 0),
  )
  readonly totalMesAnterior = computed(() => this.gastosMesAnterior().reduce((total, gasto) => total + gasto.monto, 0))
  readonly cantidadGastos = computed(() => this.gastosMesActual().length)
  readonly gastoMasAlto = computed(() => [...this.gastosMesActual()].sort((a, b) => b.monto - a.monto)[0] ?? null)
  readonly ultimosGastos = computed(() => [...this.gastos()].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5))

  readonly presupuestosMesActual = computed(() =>
    this.presupuestos().filter((presupuesto) => presupuesto.mes === this.mesActual && presupuesto.anio === this.anioActual),
  )

  readonly presupuestoActual = computed(() =>
    this.presupuestosMesActual().reduce((total, presupuesto) => total + presupuesto.monto, 0),
  )

  readonly periodoActual = computed(() => `${this.anioActual}-${String(this.mesActual).padStart(2, "0")}`)
  readonly metaAhorroActual = computed(() => this.metas().find((meta) => meta.periodo === this.periodoActual())?.monto ?? 0)

  readonly saldoDisponible = computed(() => {
    const presupuesto = this.presupuestoActual()
    return presupuesto ? presupuesto - this.totalMes() : 0
  })

  readonly categoriaTop = computed(() => {
    const categorias = new Map(this.categorias().map((categoria) => [categoria.id, categoria]))
    const acumulado = new Map<string, number>()

    for (const gasto of this.gastosMesActual()) {
      acumulado.set(gasto.categoriaId, (acumulado.get(gasto.categoriaId) ?? 0) + gasto.monto)
    }

    const [categoriaId, total] = [...acumulado.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
    if (!categoriaId) return null

    return {
      nombre: categorias.get(categoriaId)?.nombre ?? "Sin categoría",
      total,
    }
  })

  readonly categoriasChart = computed(() => {
    const categorias = new Map(this.categorias().map((categoria) => [categoria.id, categoria]))
    const acumulado = new Map<string, number>()
    const total = this.totalMes()

    for (const gasto of this.gastosMesActual()) {
      acumulado.set(gasto.categoriaId, (acumulado.get(gasto.categoriaId) ?? 0) + gasto.monto)
    }

    return [...acumulado.entries()]
      .map(([categoriaId, monto]) => {
        const categoria = categorias.get(categoriaId)
        return {
          id: categoriaId,
          nombre: categoria?.nombre ?? "Sin categoría",
          color: categoria?.color ?? "#98a2b3",
          monto,
          porcentaje: total ? (monto / total) * 100 : 0,
        }
      })
      .sort((a, b) => b.monto - a.monto)
  })

  readonly gastosPorMes = computed(() => {
    const meses = new Map<string, number>()

    for (const gasto of this.gastos()) {
      const periodo = gasto.fecha.slice(0, 7)
      meses.set(periodo, (meses.get(periodo) ?? 0) + gasto.monto)
    }

    return this.ultimosTresPeriodos().map((periodo) => ({
      periodo,
      total: meses.get(periodo) ?? 0,
    }))
  })

  readonly totalMaximoMes = computed(() => Math.max(...this.gastosPorMes().map((item) => item.total), 1))

  readonly gastosPorMetodo = computed(() => {
    const metodos = new Map<string, number>()

    for (const gasto of this.gastosMesActual()) {
      metodos.set(gasto.metodoPago, (metodos.get(gasto.metodoPago) ?? 0) + gasto.monto)
    }

    return [...metodos.entries()]
      .map(([metodo, total]) => ({ metodo, total }))
      .sort((a, b) => b.total - a.total)
  })

  readonly totalMaximoMetodo = computed(() => Math.max(...this.gastosPorMetodo().map((item) => item.total), 1))

  readonly gastosPorTipoMonto = computed(() => [
    { tipo: "Fijos", total: this.totalFijoMes() },
    { tipo: "Variables", total: this.totalVariableMes() },
  ])

  readonly totalMaximoTipoMonto = computed(() => Math.max(...this.gastosPorTipoMonto().map((item) => item.total), 1))

  readonly pieGradient = computed(() => {
    let acumulado = 0
    const partes = this.categoriasChart().map((categoria) => {
      const inicio = acumulado
      acumulado += categoria.porcentaje
      return `${categoria.color} ${inicio}% ${acumulado}%`
    })

    return partes.length ? `conic-gradient(${partes.join(", ")})` : "conic-gradient(#e5e7eb 0% 100%)"
  })

  readonly comparacion = computed(() => {
    const anterior = this.totalMesAnterior()
    if (!anterior) return null
    return ((this.totalMes() - anterior) / anterior) * 100
  })

  readonly alertas = computed(() => {
    const alertas: string[] = []
    const presupuesto = this.presupuestoActual()
    if (!presupuesto) {
      alertas.push("Todavía no cargaste presupuesto para este mes.")
    } else if (this.saldoDisponible() < 0) {
      alertas.push("Superaste el presupuesto mensual.")
    } else if (this.totalMes() > presupuesto * 0.8) {
      alertas.push("Ya consumiste más del 80% del presupuesto mensual.")
    }

    if (!this.totalMesAnterior()) {
      alertas.push("No hay comparación con el mes anterior porque todavía no hay datos suficientes.")
    }

    for (const alerta of this.alertasPersonalizadas()) {
      if (this.totalMes() > alerta.montoMaximo) {
        alertas.push(`Alerta personalizada: superaste el máximo de ${this.formatNumber(alerta.montoMaximo)}.`)
      }
    }

    if (this.metaAhorroActual() && this.presupuestoActual() - this.totalMes() < this.metaAhorroActual()) {
      alertas.push("Tu saldo actual todavía no cubre la meta de ahorro del mes.")
    }

    for (const limite of this.limitesCategoria().filter((item) => item.periodo === this.periodoActual())) {
      const categoria = this.categorias().find((item) => item.id === limite.categoriaId)
      const gastado = this.gastosMesActual()
        .filter((gasto) => gasto.categoriaId === limite.categoriaId)
        .reduce((total, gasto) => total + gasto.monto, 0)

      if (gastado > limite.monto) {
        alertas.push(`${categoria?.nombre ?? "Una categoría"} superó su límite mensual.`)
      }
    }

    return alertas
  })

  ngOnInit(): void {
    this.applyTheme(this.modoOscuro())
    this.planningService.reload()
    this.cargar()
    this.cargarAnalisis()
  }

  alternarTema(): void {
    this.modoOscuro.update((actual) => {
      const siguiente = !actual
      localStorage.setItem(this.themeKey, siguiente ? "dark" : "light")
      this.applyTheme(siguiente)
      return siguiente
    })
  }

  cargar(): void {
    this.cargando.set(true)
    forkJoin({
      gastos: this.gastoService.listar(),
      categorias: this.categoriaService.listar(),
      presupuestos: this.presupuestoService.listar(),
    }).subscribe({
      next: ({ gastos, categorias, presupuestos }) => {
        this.gastos.set(gastos)
        this.categorias.set(categorias)
        this.presupuestos.set(presupuestos)
        this.notificationService.setAlertas(this.alertas())
        this.cargando.set(false)
      },
      error: () => this.cargando.set(false),
    })
  }

  cargarAnalisis(): void {
    this.cargandoAnalisis.set(true)
    this.analisisService.obtenerDashboard(this.mesActual, this.anioActual).subscribe({
      next: (analisis) => {
        this.analisis.set(analisis)
        this.cargandoAnalisis.set(false)
      },
      error: () => {
        this.analisis.set({
          titulo: "Analisis inteligente",
          resumen: "No se pudo generar el analisis en este momento. Revisa que Ollama este abierto o intenta nuevamente mas tarde.",
          recomendaciones: ["La app sigue funcionando con tus datos aunque la IA no este disponible."],
          fuente: "local",
          usandoIa: false,
        })
        this.cargandoAnalisis.set(false)
      },
    })
  }

  private ultimosTresPeriodos(): string[] {
    return [2, 1, 0].map((offset) => {
      const date = new Date(this.anioActual, this.mesActual - 1 - offset, 1)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    })
  }

  private restoreTheme(): boolean {
    return localStorage.getItem(this.themeKey) === "dark"
  }

  private applyTheme(dark: boolean): void {
    document.body.dataset["theme"] = dark ? "dark" : "light"
  }

  private formatNumber(value: number): string {
    return value.toLocaleString("es-AR", { maximumFractionDigits: 0 })
  }
}
