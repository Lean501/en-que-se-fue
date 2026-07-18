import { CurrencyPipe } from "@angular/common"
import { Component, type OnInit, computed, inject, signal } from "@angular/core"
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms"
import { forkJoin } from "rxjs"
import { CategoriaService } from "../../core/services/categoria.service"
import { GastoService } from "../../core/services/gasto.service"
import type { Categoria } from "../../core/models/categoria.model"
import type { Gasto } from "../../core/models/gasto.model"

const COLORES = ["#1f6f5c", "#2563eb", "#b54708", "#9333ea", "#d92d20", "#0891b2", "#65a30d", "#db2777"]
const CUSTOM_COLORS_KEY = "pagos_admin_colores_categoria"
const HIDDEN_COLORS_KEY = "pagos_admin_colores_categoria_ocultos"
const MAX_COLORES = 18

interface CategoriaEstadistica extends Categoria {
  cantidad: number
  total: number
  porcentaje: number
}

@Component({
  selector: "app-categorias",
  standalone: true,
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: "./categorias.component.html",
  styleUrl: "./categorias.component.css",
})
export class CategoriasComponent implements OnInit {
  private fb = inject(FormBuilder)
  private categoriaService = inject(CategoriaService)
  private gastoService = inject(GastoService)

  readonly categorias = signal<Categoria[]>([])
  readonly gastos = signal<Gasto[]>([])
  readonly cargando = signal(true)
  readonly guardando = signal(false)
  readonly errorAccion = signal<string | null>(null)

  readonly modalAbierto = signal(false)
  readonly editandoId = signal<string | null>(null)
  readonly borrandoId = signal<string | null>(null)

  readonly colorPersonalizado = signal(COLORES[0])
  readonly colorEnEdicion = signal(COLORES[0])
  readonly editandoColor = signal(false)
  readonly colorHue = signal(165)
  readonly colorSaturation = signal(56)
  readonly colorLightness = signal(28)
  readonly coloresPersonalizados = signal<string[]>(this.restoreCustomColors())
  readonly coloresOcultos = signal<string[]>(this.restoreHiddenColors())
  readonly colores = computed(() => {
    const usados = this.categorias().map((categoria) => categoria.color)
    const ocultos = new Set(this.coloresOcultos())
    return [...new Set([...COLORES, ...this.coloresPersonalizados(), ...usados].map((color) => color.toLowerCase()))]
      .filter((color) => !ocultos.has(color))
      .slice(0, MAX_COLORES)
  })
  readonly colorSeleccionadoEsEditable = computed(() => this.colores().includes(this.colorEnEdicion().toLowerCase()))
  readonly limiteColoresAlcanzado = computed(() => this.colores().length >= MAX_COLORES)

  readonly totalGastado = computed(() => this.gastos().reduce((total, gasto) => total + gasto.monto, 0))
  readonly promedioPorGasto = computed(() => {
    const gastos = this.gastos()
    return gastos.length ? this.totalGastado() / gastos.length : 0
  })

  readonly categoriasEstadisticas = computed<CategoriaEstadistica[]>(() => {
    const totalGastado = this.totalGastado()

    return this.categorias()
      .map((categoria) => {
        const gastosCategoria = this.gastos().filter((gasto) => gasto.categoriaId === categoria.id)
        const total = gastosCategoria.reduce((sum, gasto) => sum + gasto.monto, 0)

        return {
          ...categoria,
          cantidad: gastosCategoria.length,
          total,
          porcentaje: totalGastado ? Math.round((total / totalGastado) * 100) : 0,
        }
      })
      .sort((a, b) => b.total - a.total)
  })

  readonly categoriasUsadas = computed(() => this.categoriasEstadisticas().filter((categoria) => categoria.cantidad > 0))
  readonly categoriasSinUso = computed(() => this.categoriasEstadisticas().filter((categoria) => categoria.cantidad === 0).length)
  readonly categoriaMasUsada = computed(() => {
    const categoria = [...this.categoriasEstadisticas()].sort((a, b) => b.cantidad - a.cantidad || b.total - a.total)[0]
    return categoria?.cantidad ? categoria : null
  })
  readonly categoriaMayorGasto = computed(() => this.categoriasEstadisticas().find((categoria) => categoria.total > 0) ?? null)
  readonly gastoMasAlto = computed(() => {
    const gasto = [...this.gastos()].sort((a, b) => b.monto - a.monto)[0]
    const categoria = this.categorias().find((cat) => cat.id === gasto?.categoriaId)

    return gasto
      ? {
          ...gasto,
          categoriaNombre: categoria?.nombre ?? "Sin categoría",
          categoriaColor: categoria?.color ?? "#98a2b3",
        }
      : null
  })

  readonly form = this.fb.nonNullable.group({
    nombre: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(30)]],
    color: [COLORES[0], [Validators.required]],
    descripcion: [""],
  })

  get f() {
    return this.form.controls
  }

  ngOnInit(): void {
    this.cargar()
  }

  cargar(): void {
    this.cargando.set(true)
    forkJoin({
      categorias: this.categoriaService.listar(),
      gastos: this.gastoService.listar(),
    }).subscribe({
      next: ({ categorias, gastos }) => {
        this.categorias.set(categorias)
        this.gastos.set(gastos)
        this.cargando.set(false)
      },
      error: () => this.cargando.set(false),
    })
  }

  abrirCrear(): void {
    this.editandoId.set(null)
    this.form.reset({ nombre: "", color: COLORES[0], descripcion: "" })
    this.setColorPersonalizado(COLORES[0])
    this.modalAbierto.set(true)
  }

  abrirEditar(c: Categoria): void {
    this.editandoId.set(c.id)
    this.form.reset({ nombre: c.nombre, color: c.color, descripcion: c.descripcion ?? "" })
    this.setColorPersonalizado(c.color)
    this.modalAbierto.set(true)
  }

  cerrarModal(): void {
    this.modalAbierto.set(false)
  }

  seleccionarColor(color: string): void {
    this.colorEnEdicion.set(color.toLowerCase())
    this.editandoColor.set(false)
    this.form.controls.color.setValue(color)
    this.setColorPersonalizado(color)
  }

  actualizarColorHex(value: string): void {
    const input = value.trim()
    const color = input.startsWith("#") ? input : `#${input}`
    if (!/^#[0-9a-f]{6}$/i.test(color)) return

    const normalized = color.toLowerCase()
    this.form.controls.color.setValue(normalized)
    this.setColorPersonalizado(normalized)
  }

  actualizarColorHsl(): void {
    const color = hslToHex(this.colorHue(), this.colorSaturation(), this.colorLightness())
    this.colorPersonalizado.set(color)
    this.form.controls.color.setValue(color)
  }

  agregarColorPersonalizado(): void {
    const color = this.colorPersonalizado().toLowerCase()
    this.saveCustomColor(color)
    this.seleccionarColor(color)
  }

  editarColorSeleccionado(): void {
    if (!this.colorSeleccionadoEsEditable()) return
    this.editandoColor.set(true)
  }

  guardarColorEditado(): void {
    const anterior = this.colorEnEdicion().toLowerCase()
    const siguiente = this.colorPersonalizado().toLowerCase()
    if (!this.colorSeleccionadoEsEditable()) return
    if (!/^#[0-9a-f]{6}$/i.test(siguiente)) return

    const personalizados = this.coloresPersonalizados().filter((color) => color !== anterior)
    const ocultos = COLORES.includes(anterior) ? [...new Set([...this.coloresOcultos(), anterior])] : this.coloresOcultos()
    const unique = [...new Set([...personalizados, siguiente])].slice(0, MAX_COLORES)
    this.coloresOcultos.set(ocultos)
    this.coloresPersonalizados.set(unique)
    localStorage.setItem(HIDDEN_COLORS_KEY, JSON.stringify(ocultos))
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(unique))
    this.editandoColor.set(false)
    this.seleccionarColor(siguiente)
  }

  eliminarColorSeleccionado(): void {
    const color = this.colorEnEdicion().toLowerCase()
    if (!this.colorSeleccionadoEsEditable() || this.colores().length <= 1) return

    if (COLORES.includes(color)) {
      const ocultos = [...new Set([...this.coloresOcultos(), color])]
      this.coloresOcultos.set(ocultos)
      localStorage.setItem(HIDDEN_COLORS_KEY, JSON.stringify(ocultos))
    }

    const personalizados = this.coloresPersonalizados().filter((item) => item !== color)
    this.coloresPersonalizados.set(personalizados)
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(personalizados))
    this.editandoColor.set(false)
    this.seleccionarColor(this.colores()[0] ?? COLORES[0])
  }

  moverCarrusel(contenedor: HTMLElement, direccion: "izquierda" | "derecha"): void {
    const distancia = Math.max(contenedor.clientWidth * 0.75, 220)
    contenedor.scrollBy({
      left: direccion === "derecha" ? distancia : -distancia,
      behavior: "smooth",
    })
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }
    this.guardando.set(true)
    const data = this.form.getRawValue()
    this.saveCustomColor(data.color)
    const id = this.editandoId()
    const req = id ? this.categoriaService.actualizar(id, data) : this.categoriaService.crear(data)

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
    this.errorAccion.set(null)
    this.borrandoId.set(id)
  }
  cancelarBorrar(): void {
    this.borrandoId.set(null)
  }
  eliminar(id: string): void {
    this.categoriaService.eliminar(id).subscribe({
      next: () => {
        this.borrandoId.set(null)
        this.cargar()
      },
      error: (err) => {
        this.borrandoId.set(null)
        this.errorAccion.set(err?.error?.message ?? "No se pudo eliminar la categoría.")
      },
    })
  }

  private restoreCustomColors(): string[] {
    const raw = localStorage.getItem(CUSTOM_COLORS_KEY)
    if (!raw) return []

    try {
      const colors = JSON.parse(raw) as string[]
      return colors.filter((color) => /^#[0-9a-f]{6}$/i.test(color)).map((color) => color.toLowerCase())
    } catch {
      return []
    }
  }

  private restoreHiddenColors(): string[] {
    const raw = localStorage.getItem(HIDDEN_COLORS_KEY)
    if (!raw) return []

    try {
      const colors = JSON.parse(raw) as string[]
      return colors.filter((color) => /^#[0-9a-f]{6}$/i.test(color)).map((color) => color.toLowerCase())
    } catch {
      return []
    }
  }

  private saveCustomColor(color: string): void {
    const normalized = color.toLowerCase()
    if (!/^#[0-9a-f]{6}$/i.test(normalized)) return
    if (!this.colores().includes(normalized) && this.limiteColoresAlcanzado()) return

    const visibles = this.coloresOcultos().filter((color) => color !== normalized)
    const colors = [...new Set([...this.coloresPersonalizados(), normalized])].slice(0, MAX_COLORES)
    this.coloresOcultos.set(visibles)
    this.coloresPersonalizados.set(colors)
    localStorage.setItem(HIDDEN_COLORS_KEY, JSON.stringify(visibles))
    localStorage.setItem(CUSTOM_COLORS_KEY, JSON.stringify(colors))
  }

  private setColorPersonalizado(color: string): void {
    const normalized = color.toLowerCase()
    this.colorPersonalizado.set(normalized)

    const hsl = hexToHsl(normalized)
    if (!hsl) return

    this.colorHue.set(hsl.h)
    this.colorSaturation.set(hsl.s)
    this.colorLightness.set(hsl.l)
  }
}

function hslToHex(h: number, s: number, l: number): string {
  const saturation = s / 100
  const lightness = l / 100
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1))
  const match = lightness - chroma / 2
  const [r, g, b] =
    h < 60 ? [chroma, x, 0] :
    h < 120 ? [x, chroma, 0] :
    h < 180 ? [0, chroma, x] :
    h < 240 ? [0, x, chroma] :
    h < 300 ? [x, 0, chroma] :
    [chroma, 0, x]

  return `#${toHex(r + match)}${toHex(g + match)}${toHex(b + match)}`
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return null

  const value = match[1]
  const r = Number.parseInt(value.slice(0, 2), 16) / 255
  const g = Number.parseInt(value.slice(2, 4), 16) / 255
  const b = Number.parseInt(value.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  if (delta === 0) {
    return { h: 0, s: 0, l: Math.round(lightness * 100) }
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1))
  let hue = 0
  if (max === r) hue = 60 * (((g - b) / delta) % 6)
  if (max === g) hue = 60 * ((b - r) / delta + 2)
  if (max === b) hue = 60 * ((r - g) / delta + 4)

  return {
    h: Math.round((hue + 360) % 360),
    s: Math.round(saturation * 100),
    l: Math.round(lightness * 100),
  }
}

function toHex(value: number): string {
  return Math.round(value * 255).toString(16).padStart(2, "0")
}
