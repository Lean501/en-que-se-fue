import { CurrencyPipe } from "@angular/common"
import { Component, ElementRef, type OnInit, ViewChild, computed, inject, signal } from "@angular/core"
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms"
import { forkJoin } from "rxjs"
import { GastoService } from "../../core/services/gasto.service"
import { PresupuestoService } from "../../core/services/presupuesto.service"
import type { Gasto } from "../../core/models/gasto.model"
import type { PresupuestoMensual } from "../../core/models/presupuesto.model"
import { formatMoneyValue, MONEY_MAX_VALUE, normalizeMoneyInput } from "../../core/utils/money-input"

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]

@Component({
  selector: "app-presupuestos",
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: "./presupuestos.component.html",
  styleUrl: "./presupuestos.component.css",
})
export class PresupuestosComponent implements OnInit {
  @ViewChild("montoInput") private montoInput?: ElementRef<HTMLInputElement>

  private fb = inject(FormBuilder)
  private presupuestoService = inject(PresupuestoService)
  private gastoService = inject(GastoService)

  readonly presupuestos = signal<PresupuestoMensual[]>([])
  readonly gastos = signal<Gasto[]>([])
  readonly cargando = signal(true)
  readonly guardando = signal(false)
  readonly editandoId = signal<string | null>(null)
  readonly eliminandoId = signal<string | null>(null)
  readonly montoDisplay = signal(formatMoneyValue(0))
  readonly filtroPeriodo = signal<"todos" | "mes">("todos")
  readonly filtroMes = signal(new Date().getMonth() + 1)
  readonly filtroAnio = signal(new Date().getFullYear())
  readonly meses = MESES

  readonly form = this.fb.nonNullable.group({
    mes: [new Date().getMonth() + 1, [Validators.required, Validators.min(1), Validators.max(12)]],
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    monto: [0, [Validators.required, Validators.min(0.01), Validators.max(MONEY_MAX_VALUE)]],
    origenFondos: ["", [Validators.maxLength(30)]],
  })

  readonly filas = computed<PresupuestoGrupo[]>(() => {
    const grupos = new Map<string, PresupuestoMensual[]>()
    const presupuestosFiltrados = this.presupuestos().filter((presupuesto) => {
      if (this.filtroPeriodo() === "todos") return true
      return presupuesto.mes === this.filtroMes() && presupuesto.anio === this.filtroAnio()
    })

    for (const presupuesto of presupuestosFiltrados) {
      const key = `${presupuesto.anio}-${String(presupuesto.mes).padStart(2, "0")}`
      grupos.set(key, [...(grupos.get(key) ?? []), presupuesto])
    }

    return [...grupos.entries()].map(([periodo, presupuestos]) => {
      const primero = presupuestos[0]
      const monto = presupuestos.reduce((total, presupuesto) => total + presupuesto.monto, 0)
      const gastado = this.gastos()
        .filter((gasto) => {
          const fecha = new Date(`${gasto.fecha}T00:00:00`)
          return fecha.getMonth() + 1 === primero.mes && fecha.getFullYear() === primero.anio
        })
        .reduce((total, gasto) => total + gasto.monto, 0)

      return {
        periodo,
        mes: primero.mes,
        anio: primero.anio,
        label: `${MESES[primero.mes - 1]} ${primero.anio}`,
        presupuestos: presupuestos.sort((a, b) => Number(a.id) - Number(b.id)),
        monto,
        gastado,
        restante: monto - gastado,
        porcentaje: monto ? Math.min((gastado / monto) * 100, 100) : 0,
      }
    })
  })

  actualizarFiltroMes(value: string): void {
    this.filtroMes.set(Number(value))
  }

  actualizarFiltroAnio(input: HTMLInputElement): void {
    const digits = input.value.replace(/\D/g, "").slice(0, 4)
    input.value = digits
    this.filtroAnio.set(Number(digits || new Date().getFullYear()))
  }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    forkJoin({
      presupuestos: this.presupuestoService.listar(),
      gastos: this.gastoService.listar(),
    }).subscribe({
      next: ({ presupuestos, gastos }) => {
        this.presupuestos.set(presupuestos)
        this.gastos.set(gastos)
        this.cargando.set(false)
      },
      error: () => this.cargando.set(false),
    })
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.guardando.set(true)
    const id = this.editandoId()
    const request = id
      ? this.presupuestoService.actualizar(id, this.form.getRawValue())
      : this.presupuestoService.guardar(this.form.getRawValue())

    request.subscribe({
      next: () => {
        this.guardando.set(false)
        this.editandoId.set(null)
        this.form.reset({
          mes: new Date().getMonth() + 1,
          anio: new Date().getFullYear(),
          monto: 0,
          origenFondos: "",
        })
        this.montoDisplay.set(formatMoneyValue(0))
        this.cargar()
      },
      error: () => this.guardando.set(false),
    })
  }

  editar(presupuesto: PresupuestoMensual): void {
    this.editandoId.set(presupuesto.id)
    this.form.reset({
      mes: presupuesto.mes,
      anio: presupuesto.anio,
      monto: presupuesto.monto,
      origenFondos: presupuesto.origenFondos ?? "",
    })
    this.montoDisplay.set(formatMoneyValue(presupuesto.monto))
    setTimeout(() => {
      const input = this.montoInput?.nativeElement
      if (!input) return

      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    })
  }

  cancelarEdicion(): void {
    this.editandoId.set(null)
    this.form.reset({
      mes: new Date().getMonth() + 1,
      anio: new Date().getFullYear(),
      monto: 0,
      origenFondos: "",
    })
    this.montoDisplay.set(formatMoneyValue(0))
  }

  actualizarMonto(value: string): void {
    const money = normalizeMoneyInput(value)
    this.montoDisplay.set(money.display)
    this.form.controls.monto.setValue(money.amount)
    this.form.controls.monto.markAsDirty()
  }

  permitirSoloNumeros(event: KeyboardEvent): void {
    const allowedKeys = ["Backspace", "Delete", "Tab", "Enter", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]
    const isShortcut = event.ctrlKey || event.metaKey
    const isDigit = /^\d$/.test(event.key)

    if (isDigit || isShortcut || allowedKeys.includes(event.key)) {
      return
    }

    event.preventDefault()
  }

  pegarSoloNumeros(event: ClipboardEvent): void {
    const pasted = event.clipboardData?.getData("text") ?? ""

    if (/^\d+$/.test(pasted)) {
      return
    }

    event.preventDefault()
  }

  actualizarAnio(input: HTMLInputElement): void {
    const digits = input.value.replace(/\D/g, "").slice(0, 4)
    input.value = digits
    this.form.controls.anio.setValue(Number(digits || 0))
    this.form.controls.anio.markAsDirty()
  }

  confirmarEliminar(id: string): void {
    this.eliminandoId.set(id)
  }

  cancelarEliminar(): void {
    this.eliminandoId.set(null)
  }

  eliminar(id: string): void {
    this.presupuestoService.eliminar(id).subscribe({
      next: () => {
        this.eliminandoId.set(null)
        this.cargar()
      },
    })
  }
}

interface PresupuestoGrupo {
  periodo: string
  mes: number
  anio: number
  label: string
  presupuestos: PresupuestoMensual[]
  monto: number
  gastado: number
  restante: number
  porcentaje: number
}
