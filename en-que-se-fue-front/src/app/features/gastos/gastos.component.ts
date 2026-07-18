import { Component, type OnInit, computed, inject, signal } from "@angular/core"
import { CurrencyPipe, DatePipe } from "@angular/common"
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms"
import { forkJoin } from "rxjs"
import { GastoService } from "../../core/services/gasto.service"
import { CategoriaService } from "../../core/services/categoria.service"
import type { Gasto, GastoConCategoria, MetodoPago, TipoMonto } from "../../core/models/gasto.model"
import type { Categoria } from "../../core/models/categoria.model"
import { formatMoneyValue, MONEY_MAX_VALUE, normalizeMoneyInput } from "../../core/utils/money-input"

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
type SortColumn = "descripcion" | "categoria" | "metodo" | "tipo" | "fecha" | "monto"
type SortDirection = "asc" | "desc"
type ViewMode = "lista" | "calendario"

interface CalendarioDia {
  fecha: string
  dia: number | null
  gastos: GastoConCategoria[]
  total: number
}

interface CalendarioMes {
  label: string
  celdas: CalendarioDia[]
  totalGastos: number
}

@Component({
  selector: "app-gastos",
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: "./gastos.component.html",
  styleUrl: "./gastos.component.css",
})
export class GastosComponent implements OnInit {
  private fb = inject(FormBuilder)
  private gastoService = inject(GastoService)
  private categoriaService = inject(CategoriaService)

  readonly gastos = signal<Gasto[]>([])
  readonly categorias = signal<Categoria[]>([])
  readonly cargando = signal(true)
  readonly guardando = signal(false)

  // Filtros
  readonly filtroTexto = signal("")
  readonly filtroCategoria = signal<string>("")
  readonly periodoCalendario = signal(this.periodoActual())
  readonly meses = MESES
  readonly ordenColumna = signal<SortColumn>("fecha")
  readonly ordenDireccion = signal<SortDirection>("desc")
  readonly vista = signal<ViewMode>("lista")
  readonly ordenActivo = computed(() => this.ordenColumna() !== "fecha" || this.ordenDireccion() !== "desc")

  // Modal
  readonly modalAbierto = signal(false)
  readonly editandoId = signal<string | null>(null)
  readonly montoDisplay = signal(formatMoneyValue(0))
  readonly notaInternaEditando = signal("")

  // Confirmación de borrado
  readonly borrandoId = signal<string | null>(null)

  readonly metodos: { value: MetodoPago; label: string }[] = [
    { value: "efectivo", label: "Efectivo" },
    { value: "tarjeta", label: "Tarjeta" },
    { value: "transferencia", label: "Transferencia" },
  ]

  readonly form = this.fb.nonNullable.group({
    descripcion: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    monto: [0, [Validators.required, Validators.min(0.01), Validators.max(MONEY_MAX_VALUE)]],
    fecha: [this.hoy(), [Validators.required]],
    categoriaId: ["", [Validators.required]],
    metodoPago: ["tarjeta" as MetodoPago, [Validators.required]],
    tipoMonto: ["variable" as TipoMonto, [Validators.required]],
    notas: ["", [Validators.maxLength(250)]],
  })

  private catMap = computed(() => new Map(this.categorias().map((c) => [c.id, c])))

  readonly gastosFiltrados = computed<GastoConCategoria[]>(() => {
    const texto = this.filtroTexto().toLowerCase().trim()
    const cat = this.filtroCategoria()
    const map = this.catMap()
    return this.gastos()
      .filter((g) => (cat ? g.categoriaId === cat : true))
      .filter((g) => (texto ? g.descripcion.toLowerCase().includes(texto) : true))
      .map((g) => ({
        ...g,
        categoriaNombre: map.get(g.categoriaId)?.nombre ?? "Sin categoría",
        categoriaColor: map.get(g.categoriaId)?.color ?? "#98a2b3",
      }))
      .sort((a, b) => this.compararGastos(a, b))
  })

  readonly total = computed(() => this.gastosFiltrados().reduce((s, g) => s + g.monto, 0))

  readonly gastosCalendario = computed<GastoConCategoria[]>(() => {
    const texto = this.filtroTexto().toLowerCase().trim()
    const cat = this.filtroCategoria()
    const map = this.catMap()

    return this.gastos()
      .filter((g) => (cat ? g.categoriaId === cat : true))
      .filter((g) => (texto ? g.descripcion.toLowerCase().includes(texto) : true))
      .map((g) => ({
        ...g,
        categoriaNombre: map.get(g.categoriaId)?.nombre ?? "Sin categoría",
        categoriaColor: map.get(g.categoriaId)?.color ?? "#98a2b3",
      }))
      .sort((a, b) => this.compararGastos(a, b))
  })

  readonly calendario = computed<CalendarioMes>(() => {
    const [anio, mes] = this.periodoCalendario().split("-").map(Number)
    return this.crearCalendarioMes(anio, mes)
  })

  private crearCalendarioMes(anio: number, mes: number): CalendarioMes {
    const primerDia = new Date(anio, mes - 1, 1)
    const diasEnMes = new Date(anio, mes, 0).getDate()
    const inicioSemana = primerDia.getDay()
    const celdas: CalendarioDia[] = []

    for (let i = 0; i < inicioSemana; i++) {
      celdas.push({ fecha: "", dia: null, gastos: [], total: 0 })
    }

    for (let dia = 1; dia <= diasEnMes; dia++) {
      const fecha = `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`
      const gastos = this.gastosCalendario().filter((gasto) => gasto.fecha === fecha)
      celdas.push({
        fecha,
        dia,
        gastos,
        total: gastos.reduce((total, gasto) => total + gasto.monto, 0),
      })
    }

    return {
      label: `${MESES[mes - 1]} ${anio}`,
      celdas,
      totalGastos: celdas.reduce((total, dia) => total + dia.gastos.length, 0),
    }
  }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    forkJoin({
      gastos: this.gastoService.listar(),
      categorias: this.categoriaService.listar(),
    }).subscribe({
      next: ({ gastos, categorias }) => {
        this.gastos.set(gastos)
        this.categorias.set(categorias)
        this.cargando.set(false)
      },
      error: () => this.cargando.set(false),
    })
  }

  abrirCrear(): void {
    this.editandoId.set(null)
    this.notaInternaEditando.set("")
    this.form.reset({
      descripcion: "",
      monto: 0,
      fecha: this.hoy(),
      categoriaId: this.categorias()[0]?.id ?? "",
      metodoPago: "tarjeta",
      tipoMonto: "variable",
      notas: "",
    })
    this.montoDisplay.set(formatMoneyValue(0))
    this.modalAbierto.set(true)
  }

  abrirEditar(g: Gasto): void {
    this.editandoId.set(g.id)
    const nota = this.separarNotaRecurrente(g.notas)
    this.notaInternaEditando.set(nota.interna)
    this.form.reset({
      descripcion: g.descripcion,
      monto: g.monto,
      fecha: g.fecha,
      categoriaId: g.categoriaId,
      metodoPago: g.metodoPago,
      tipoMonto: g.tipoMonto ?? "variable",
      notas: nota.visible,
    })
    this.montoDisplay.set(formatMoneyValue(g.monto))
    this.modalAbierto.set(true)
  }

  cerrarModal(): void {
    this.modalAbierto.set(false)
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    this.guardando.set(true)
    const data = this.form.getRawValue()
    data.notas = this.combinarNotaRecurrente(this.notaInternaEditando(), data.notas)
    const id = this.editandoId()
    const req = id ? this.gastoService.actualizar(id, data) : this.gastoService.crear(data)

    req.subscribe({
      next: () => {
        this.guardando.set(false)
        this.modalAbierto.set(false)
        this.cargar()
      },
      error: () => this.guardando.set(false),
    })
  }

  confirmarBorrar(id: string): void {
    this.borrandoId.set(id)
  }
  cancelarBorrar(): void {
    this.borrandoId.set(null)
  }
  eliminar(id: string): void {
    this.gastoService.eliminar(id).subscribe({
      next: () => {
        this.borrandoId.set(null)
        this.cargar()
      },
    })
  }

  get f() {
    return this.form.controls
  }

  actualizarMonto(value: string): void {
    const money = normalizeMoneyInput(value)
    this.montoDisplay.set(money.display)
    this.form.controls.monto.setValue(money.amount)
    this.form.controls.monto.markAsDirty()
  }

  moverCalendario(delta: number): void {
    const [anio, mes] = this.periodoCalendario().split("-").map(Number)
    const date = new Date(anio, mes - 1 + delta, 1)
    this.periodoCalendario.set(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`)
  }

  notaVisible(notas?: string): string {
    const nota = this.separarNotaRecurrente(notas)
    return nota.visible || (nota.interna ? "Gasto recurrente" : "")
  }

  fondoCategoria(color: string): string {
    if (!this.esModoOscuro()) return `${color}22`
    return this.esColorOscuro(color) ? `${color}66` : `${color}2e`
  }

  bordeCategoria(color: string): string {
    if (!this.esModoOscuro()) return "transparent"
    return this.esColorOscuro(color) ? `${color}` : `${color}80`
  }

  textoCategoria(color: string): string {
    if (!this.esModoOscuro()) return color
    return this.esColorOscuro(color) ? "#f8fafc" : color
  }

  ordenarPor(columna: SortColumn): void {
    if (this.ordenColumna() === columna) {
      this.ordenDireccion.update((direccion) => (direccion === "asc" ? "desc" : "asc"))
      return
    }

    this.ordenColumna.set(columna)
    this.ordenDireccion.set(columna === "fecha" || columna === "monto" ? "desc" : "asc")
  }

  indicadorOrden(columna: SortColumn): string {
    if (this.ordenColumna() !== columna) return ""
    return this.ordenDireccion() === "asc" ? "↑" : "↓"
  }

  restablecerOrden(): void {
    this.ordenColumna.set("fecha")
    this.ordenDireccion.set("desc")
  }

  private compararGastos(a: GastoConCategoria, b: GastoConCategoria): number {
    const factor = this.ordenDireccion() === "asc" ? 1 : -1
    const columna = this.ordenColumna()

    if (columna === "monto") {
      return (a.monto - b.monto) * factor
    }

    if (columna === "fecha") {
      return a.fecha.localeCompare(b.fecha) * factor
    }

    const values: Record<Exclude<SortColumn, "monto" | "fecha">, [string, string]> = {
      descripcion: [a.descripcion, b.descripcion],
      categoria: [a.categoriaNombre, b.categoriaNombre],
      metodo: [a.metodoPago, b.metodoPago],
      tipo: [a.tipoMonto, b.tipoMonto],
    }

    const [left, right] = values[columna]
    return left.localeCompare(right, "es", { sensitivity: "base" }) * factor
  }

  private hoy(): string {
    return new Date().toISOString().slice(0, 10)
  }

  private periodoActual(): string {
    const date = new Date()
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
  }

  private separarNotaRecurrente(notas?: string): { interna: string; visible: string } {
    const value = notas?.trim() ?? ""
    if (!value) return { interna: "", visible: "" }

    const lines = value.split(/\r?\n/).map((line) => line.trim())
    const first = lines[0] ?? ""
    if (first.startsWith("__RECURRENTE:") || first.startsWith("Recurrente:")) {
      return { interna: first, visible: lines.slice(1).join("\n").trim() }
    }

    return { interna: "", visible: value }
  }

  private combinarNotaRecurrente(interna: string, visible?: string): string {
    const notaVisible = visible?.trim() ?? ""
    if (!interna) return notaVisible
    if (!notaVisible) return interna
    return `${interna}\n${notaVisible}`.slice(0, 250)
  }

  private esModoOscuro(): boolean {
    return document.body.dataset["theme"] === "dark"
  }

  private esColorOscuro(color: string): boolean {
    const hex = color.replace("#", "")
    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return false

    const red = Number.parseInt(hex.slice(0, 2), 16)
    const green = Number.parseInt(hex.slice(2, 4), 16)
    const blue = Number.parseInt(hex.slice(4, 6), 16)
    const luminancia = (0.299 * red + 0.587 * green + 0.114 * blue) / 255

    return luminancia < 0.42
  }
}
