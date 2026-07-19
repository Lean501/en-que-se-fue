import { CurrencyPipe, DatePipe, DecimalPipe } from "@angular/common"
import { Component, type OnInit, computed, inject, signal } from "@angular/core"
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms"
import { forkJoin } from "rxjs"
import type { Categoria } from "../../core/models/categoria.model"
import type { Gasto, MetodoPago } from "../../core/models/gasto.model"
import type { PresupuestoMensual } from "../../core/models/presupuesto.model"
import { CategoriaService } from "../../core/services/categoria.service"
import { GastoService } from "../../core/services/gasto.service"
import { PlanningService, type GastoRecurrente } from "../../core/services/planning.service"
import { PresupuestoService } from "../../core/services/presupuesto.service"
import { formatMoneyValue, MONEY_MAX_VALUE, normalizeMoneyInput } from "../../core/utils/money-input"

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

@Component({
  selector: "app-planificacion",
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe, DecimalPipe],
  templateUrl: "./planificacion.component.html",
  styleUrl: "./planificacion.component.css",
})
export class PlanificacionComponent implements OnInit {
  private fb = inject(FormBuilder)
  private gastoService = inject(GastoService)
  private categoriaService = inject(CategoriaService)
  private presupuestoService = inject(PresupuestoService)
  private planning = inject(PlanningService)

  readonly gastos = signal<Gasto[]>([])
  readonly categorias = signal<Categoria[]>([])
  readonly presupuestos = signal<PresupuestoMensual[]>([])
  readonly cargando = signal(true)
  readonly generandoId = signal<string | null>(null)
  readonly periodo = signal(this.periodoActual())

  readonly metaDisplay = signal(formatMoneyValue(0))
  readonly limiteDisplay = signal(formatMoneyValue(0))
  readonly recurrenteDisplay = signal(formatMoneyValue(0))
  readonly alertaMontoDisplay = signal(formatMoneyValue(0))
  readonly selectorPeriodoAbierto = signal(false)
  readonly anioSelector = signal(new Date().getFullYear())
  readonly meses = MESES

  readonly metodos: { value: MetodoPago; label: string }[] = [
    { value: "efectivo", label: "Efectivo" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "transferencia", label: "Transferencia" },
  ]

  readonly metaForm = this.fb.nonNullable.group({
    monto: [0, [Validators.required, Validators.min(0), Validators.max(MONEY_MAX_VALUE)]],
  })

  readonly limiteForm = this.fb.nonNullable.group({
    categoriaId: ["", [Validators.required]],
    monto: [0, [Validators.required, Validators.min(0.01), Validators.max(MONEY_MAX_VALUE)]],
  })

  readonly recurrenteForm = this.fb.nonNullable.group({
    descripcion: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    monto: [0, [Validators.required, Validators.min(0.01), Validators.max(MONEY_MAX_VALUE)]],
    categoriaId: ["", [Validators.required]],
    metodoPago: ["transferencia" as MetodoPago, [Validators.required]],
    dia: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
  })

  readonly alertaForm = this.fb.nonNullable.group({
    nombre: ["Limite mensual", [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    montoMaximo: [0, [Validators.required, Validators.min(0.01), Validators.max(MONEY_MAX_VALUE)]],
  })

  readonly metas = this.planning.metas
  readonly limites = this.planning.limites
  readonly recurrentes = this.planning.recurrentes
  readonly alertasPersonalizadas = this.planning.alertasPersonalizadas

  readonly gastosPeriodo = computed(() => this.gastos().filter((gasto) => gasto.fecha.startsWith(this.periodo())))
  readonly gastosPeriodoAnterior = computed(() => {
    const anterior = this.periodoOffset(this.periodo(), -1)
    return this.gastos().filter((gasto) => gasto.fecha.startsWith(anterior))
  })

  readonly totalGastado = computed(() => this.gastosPeriodo().reduce((total, gasto) => total + gasto.monto, 0))
  readonly totalAnterior = computed(() => this.gastosPeriodoAnterior().reduce((total, gasto) => total + gasto.monto, 0))
  readonly ingresosPeriodo = computed(() =>
    this.presupuestos()
      .filter((presupuesto) => `${presupuesto.anio}-${String(presupuesto.mes).padStart(2, "0")}` === this.periodo())
      .reduce((total, presupuesto) => total + presupuesto.monto, 0),
  )
  readonly metaPeriodo = computed(() => this.metas().find((meta) => meta.periodo === this.periodo())?.monto ?? 0)
  readonly totalFijoPeriodo = computed(() =>
    this.gastosPeriodo()
      .filter((gasto) => gasto.tipoMonto === "fijo")
      .reduce((total, gasto) => total + gasto.monto, 0),
  )
  readonly totalVariablePeriodo = computed(() =>
    this.gastosPeriodo()
      .filter((gasto) => gasto.tipoMonto !== "fijo")
      .reduce((total, gasto) => total + gasto.monto, 0),
  )
  readonly disponibleConMeta = computed(() => Math.max(this.ingresosPeriodo() - this.totalGastado() - this.metaPeriodo(), 0))
  readonly ahorroPosible = computed(() => Math.max(this.ingresosPeriodo() - this.totalGastado(), 0))
  readonly progresoMeta = computed(() => {
    const meta = this.metaPeriodo()
    return meta ? Math.min((this.ahorroPosible() / meta) * 100, 100) : 0
  })
  readonly variacionMensual = computed(() => {
    const anterior = this.totalAnterior()
    if (!anterior) return null
    return ((this.totalGastado() - anterior) / anterior) * 100
  })

  readonly limitesPeriodo = computed(() => this.limites().filter((limite) => limite.periodo === this.periodo()))
  readonly limitesDetalle = computed(() =>
    this.limitesPeriodo().map((limite) => {
      const categoria = this.categorias().find((item) => item.id === limite.categoriaId)
      const gastado = this.gastosPeriodo()
        .filter((gasto) => gasto.categoriaId === limite.categoriaId)
        .reduce((total, gasto) => total + gasto.monto, 0)

      return {
        ...limite,
        categoriaNombre: categoria?.nombre ?? "Sin categoría",
        categoriaColor: categoria?.color ?? "#98a2b3",
        gastado,
        restante: limite.monto - gastado,
        porcentaje: limite.monto ? Math.min((gastado / limite.monto) * 100, 100) : 0,
      }
    }),
  )

  readonly comparacionCategorias = computed(() => {
    const actual = this.totalPorCategoria(this.gastosPeriodo())
    const anterior = this.totalPorCategoria(this.gastosPeriodoAnterior())

    return this.categorias()
      .map((categoria) => {
        const ahora = actual.get(categoria.id) ?? 0
        const antes = anterior.get(categoria.id) ?? 0
        return {
          categoria,
          ahora,
          antes,
          diferencia: ahora - antes,
        }
      })
      .filter((item) => item.ahora > 0 || item.antes > 0)
      .sort((a, b) => Math.abs(b.diferencia) - Math.abs(a.diferencia))
      .slice(0, 6)
  })

  readonly planDelMes = computed(() => {
    const ingresos = this.ingresosPeriodo()
    const fijos = this.totalFijoPeriodo()
    const variables = this.totalVariablePeriodo()
    const meta = this.metaPeriodo()
    const disponible = ingresos - fijos - variables - meta
    const base = Math.max(ingresos, fijos + variables + meta, 1)

    return [
      {
        label: "Gastos fijos",
        detalle: "Recurrentes creados como gasto del mes",
        monto: fijos,
        porcentaje: this.porcentajePlan(fijos, base),
        tone: "fixed",
      },
      {
        label: "Gastos variables",
        detalle: "Compras y movimientos cargados manualmente",
        monto: variables,
        porcentaje: this.porcentajePlan(variables, base),
        tone: "variable",
      },
      {
        label: "Meta de ahorro",
        detalle: meta ? "Monto reservado como objetivo" : "Todavía no definiste una meta",
        monto: meta,
        porcentaje: this.porcentajePlan(meta, base),
        tone: "saving",
      },
      {
        label: "Dinero disponible",
        detalle: disponible >= 0 ? "Después de gastos y metas" : "Falta para cubrir gastos y metas",
        monto: disponible,
        porcentaje: this.porcentajePlan(Math.abs(disponible), base),
        tone: disponible >= 0 ? "available" : "over",
      },
    ]
  })

  readonly alertasInteligentes = computed(() => {
    const alertas: string[] = []

    if (this.metaPeriodo() && this.ahorroPosible() < this.metaPeriodo()) {
      alertas.push("La meta de ahorro todavía no está cubierta con el saldo actual del mes.")
    }

    for (const limite of this.limitesDetalle()) {
      if (limite.gastado > limite.monto) {
        alertas.push(`${limite.categoriaNombre} superó su límite por ${this.money(limite.gastado - limite.monto)}.`)
      } else if (limite.gastado > limite.monto * 0.8) {
        alertas.push(`${limite.categoriaNombre} ya consumió más del 80% de su límite.`)
      }
    }

    const variacion = this.variacionMensual()
    if (variacion !== null && variacion > 20) {
      alertas.push(`Este mes gastaste ${Math.round(variacion)}% más que el mes anterior.`)
    }

    return alertas
  })

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    this.planning.reload()
    forkJoin({
      gastos: this.gastoService.listar(),
      categorias: this.categoriaService.listar(),
      presupuestos: this.presupuestoService.listar(),
    }).subscribe({
      next: ({ gastos, categorias, presupuestos }) => {
        this.gastos.set(gastos)
        this.categorias.set(categorias)
        this.presupuestos.set(presupuestos)
        this.limiteForm.patchValue({ categoriaId: categorias[0]?.id ?? "" })
        this.recurrenteForm.patchValue({ categoriaId: categorias[0]?.id ?? "" })
        this.metaDisplay.set(formatMoneyValue(this.metaPeriodo()))
        this.metaForm.controls.monto.setValue(this.metaPeriodo())
        this.cargando.set(false)
      },
      error: () => this.cargando.set(false),
    })
  }

  cambiarPeriodo(value: string): void {
    if (!value) return

    this.periodo.set(value)
    this.metaDisplay.set(formatMoneyValue(this.metaPeriodo()))
    this.metaForm.controls.monto.setValue(this.metaPeriodo())
    this.selectorPeriodoAbierto.set(false)
  }

  alternarSelectorPeriodo(): void {
    this.anioSelector.set(Number(this.periodo().slice(0, 4)))
    this.selectorPeriodoAbierto.update((value) => !value)
  }

  seleccionarPeriodo(mes: number): void {
    this.cambiarPeriodo(`${this.anioSelector()}-${String(mes).padStart(2, "0")}`)
  }

  esPeriodoSeleccionado(mes: number): boolean {
    return this.periodo() === `${this.anioSelector()}-${String(mes).padStart(2, "0")}`
  }

  actualizarAnioSelector(input: HTMLInputElement): void {
    const digits = input.value.replace(/\D/g, "").slice(0, 4)
    input.value = digits
    this.anioSelector.set(Number(digits || new Date().getFullYear()))
  }

  moverAnioSelector(delta: number): void {
    this.anioSelector.update((anio) => Math.max(1, anio + delta))
  }

  guardarMeta(): void {
    if (this.metaForm.invalid) return
    this.planning.guardarMeta({ periodo: this.periodo(), monto: this.metaForm.controls.monto.value })
  }

  guardarLimite(): void {
    if (this.limiteForm.invalid) {
      this.limiteForm.markAllAsTouched()
      return
    }

    const value = this.limiteForm.getRawValue()
    this.planning.guardarLimite({ periodo: this.periodo(), categoriaId: value.categoriaId, monto: value.monto })
    this.limiteForm.patchValue({ monto: 0 })
    this.limiteDisplay.set(formatMoneyValue(0))
  }

  eliminarLimite(id: string): void {
    this.planning.eliminarLimite(id)
  }

  guardarRecurrente(): void {
    if (this.recurrenteForm.invalid) {
      this.recurrenteForm.markAllAsTouched()
      return
    }

    this.planning.guardarRecurrente({ ...this.recurrenteForm.getRawValue(), dia: this.diaActual() })
    this.recurrenteForm.reset({
      descripcion: "",
      monto: 0,
      categoriaId: this.categorias()[0]?.id ?? "",
      metodoPago: "transferencia",
      dia: this.diaActual(),
    })
    this.recurrenteDisplay.set(formatMoneyValue(0))
  }

  eliminarRecurrente(id: string): void {
    this.planning.eliminarRecurrente(id)
  }

  guardarAlertaPersonalizada(): void {
    if (this.alertaForm.invalid) {
      this.alertaForm.markAllAsTouched()
      return
    }

    this.planning.guardarAlertaPersonalizada(this.alertaForm.getRawValue())
    this.alertaForm.reset({ nombre: "Limite mensual", montoMaximo: 0 })
    this.alertaMontoDisplay.set(formatMoneyValue(0))
  }

  eliminarAlertaPersonalizada(id: string): void {
    this.planning.eliminarAlertaPersonalizada(id)
  }

  toggleRecurrente(recurrente: GastoRecurrente): void {
    this.planning.actualizarRecurrente({ ...recurrente, activo: !recurrente.activo })
  }

  generarRecurrente(recurrente: GastoRecurrente): void {
    if (!recurrente.activo || this.recurrenteGenerado(recurrente)) return

    this.generandoId.set(recurrente.id)
    const categoria = this.categorias().find((item) => item.id === recurrente.categoriaId)
    const dia = String(this.diaActual()).padStart(2, "0")

    this.gastoService
      .crear({
        descripcion: recurrente.descripcion,
        monto: recurrente.monto,
        fecha: `${this.periodo()}-${dia}`,
        categoriaId: recurrente.categoriaId,
        metodoPago: recurrente.metodoPago,
        tipoMonto: "fijo",
        notas: `__RECURRENTE:${recurrente.id}__`,
      })
      .subscribe({
        next: () => {
          this.generandoId.set(null)
          this.cargar()
        },
        error: () => this.generandoId.set(null),
      })
  }

  recurrenteGenerado(recurrente: GastoRecurrente): boolean {
    return this.gastosPeriodo().some((gasto) =>
      gasto.notas?.includes(`__RECURRENTE:${recurrente.id}__`) || gasto.notas?.includes(`Recurrente: ${recurrente.id}`),
    )
  }

  actualizarMeta(value: string): void {
    const money = normalizeMoneyInput(value)
    this.metaDisplay.set(money.display)
    this.metaForm.controls.monto.setValue(money.amount)
  }

  actualizarLimite(value: string): void {
    const money = normalizeMoneyInput(value)
    this.limiteDisplay.set(money.display)
    this.limiteForm.controls.monto.setValue(money.amount)
  }

  actualizarRecurrenteMonto(value: string): void {
    const money = normalizeMoneyInput(value)
    this.recurrenteDisplay.set(money.display)
    this.recurrenteForm.controls.monto.setValue(money.amount)
  }

  actualizarMontoAlerta(value: string): void {
    const money = normalizeMoneyInput(value)
    this.alertaMontoDisplay.set(money.display)
    this.alertaForm.controls.montoMaximo.setValue(money.amount)
    this.alertaForm.controls.montoMaximo.markAsDirty()
  }

  permitirSoloNumeros(event: KeyboardEvent): void {
    const teclasPermitidas = ["Backspace", "Delete", "Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]

    if (event.ctrlKey || event.metaKey || teclasPermitidas.includes(event.key)) return
    if (/^\d$/.test(event.key)) return

    event.preventDefault()
  }

  permitirPegadoNumerico(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData("text") ?? ""

    if (!/^\d+$/.test(text)) {
      event.preventDefault()
    }
  }

  categoriaNombre(id: string): string {
    return this.categorias().find((categoria) => categoria.id === id)?.nombre ?? "Sin categoría"
  }

  periodoLabel(periodo = this.periodo()): string {
    const [anio, mes] = periodo.split("-").map(Number)
    return `${MESES[mes - 1]} ${anio}`
  }

  private totalPorCategoria(gastos: Gasto[]): Map<string, number> {
    const map = new Map<string, number>()
    for (const gasto of gastos) {
      map.set(gasto.categoriaId, (map.get(gasto.categoriaId) ?? 0) + gasto.monto)
    }
    return map
  }

  private periodoActual(): string {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  private periodoOffset(periodo: string, offset: number): string {
    const [anio, mes] = periodo.split("-").map(Number)
    const date = new Date(anio, mes - 1 + offset, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  private money(value: number): string {
    return value.toLocaleString("es-AR", { maximumFractionDigits: 0 })
  }

  private porcentajePlan(value: number, base: number): number {
    return Math.min((value / base) * 100, 100)
  }

  private diaActual(): number {
    return Math.min(new Date().getDate(), 28)
  }

}
