import { Injectable, computed, inject, signal } from "@angular/core"
import { AuthService } from "./auth.service"

export interface MetaAhorro {
  periodo: string
  monto: number
}

export interface LimiteCategoria {
  id: string
  periodo: string
  categoriaId: string
  monto: number
}

export interface GastoRecurrente {
  id: string
  descripcion: string
  monto: number
  categoriaId: string
  metodoPago: "efectivo" | "tarjeta" | "transferencia"
  dia: number
  activo: boolean
}

export interface AlertaPersonalizada {
  id: string
  nombre: string
  montoMaximo: number
}

@Injectable({ providedIn: "root" })
export class PlanningService {
  private auth = inject(AuthService)

  private readonly metasKeyPrefix = "pagos_admin_metas_ahorro"
  private readonly limitesKeyPrefix = "pagos_admin_limites_categoria"
  private readonly recurrentesKeyPrefix = "pagos_admin_gastos_recurrentes"
  private readonly alertasKeyPrefix = "pagos_admin_alertas"

  readonly metas = signal<MetaAhorro[]>(this.restore<MetaAhorro>(this.metasKey()))
  readonly limites = signal<LimiteCategoria[]>(this.restore<LimiteCategoria>(this.limitesKey()))
  readonly recurrentes = signal<GastoRecurrente[]>(this.restore<GastoRecurrente>(this.recurrentesKey()))
  readonly alertasPersonalizadas = signal<AlertaPersonalizada[]>(this.restore<AlertaPersonalizada>(this.alertasKey()))

  readonly usuarioEmail = computed(() => this.auth.getUsuario()?.email?.toLowerCase() ?? "anonimo")

  reload(): void {
    this.metas.set(this.restore<MetaAhorro>(this.metasKey()))
    this.limites.set(this.restore<LimiteCategoria>(this.limitesKey()))
    this.recurrentes.set(this.restore<GastoRecurrente>(this.recurrentesKey()))
    this.alertasPersonalizadas.set(this.restore<AlertaPersonalizada>(this.alertasKey()))
  }

  guardarMeta(meta: MetaAhorro): void {
    const metas = this.metas().filter((item) => item.periodo !== meta.periodo)
    if (meta.monto > 0) {
      metas.push(meta)
    }

    this.save(this.metasKey(), metas)
    this.metas.set(metas)
  }

  guardarLimite(limite: Omit<LimiteCategoria, "id">): void {
    const limites = this.limites().filter(
      (item) => !(item.periodo === limite.periodo && item.categoriaId === limite.categoriaId),
    )
    limites.push({ ...limite, id: crypto.randomUUID() })
    this.save(this.limitesKey(), limites)
    this.limites.set(limites)
  }

  eliminarLimite(id: string): void {
    const limites = this.limites().filter((item) => item.id !== id)
    this.save(this.limitesKey(), limites)
    this.limites.set(limites)
  }

  guardarRecurrente(recurrente: Omit<GastoRecurrente, "id" | "activo">): void {
    const recurrentes = [...this.recurrentes(), { ...recurrente, id: crypto.randomUUID(), activo: true }]
    this.save(this.recurrentesKey(), recurrentes)
    this.recurrentes.set(recurrentes)
  }

  actualizarRecurrente(recurrente: GastoRecurrente): void {
    const recurrentes = this.recurrentes().map((item) => (item.id === recurrente.id ? recurrente : item))
    this.save(this.recurrentesKey(), recurrentes)
    this.recurrentes.set(recurrentes)
  }

  eliminarRecurrente(id: string): void {
    const recurrentes = this.recurrentes().filter((item) => item.id !== id)
    this.save(this.recurrentesKey(), recurrentes)
    this.recurrentes.set(recurrentes)
  }

  guardarAlertaPersonalizada(alerta: Omit<AlertaPersonalizada, "id">): void {
    const alertas = [...this.alertasPersonalizadas(), { ...alerta, id: crypto.randomUUID() }]
    this.save(this.alertasKey(), alertas)
    this.alertasPersonalizadas.set(alertas)
  }

  eliminarAlertaPersonalizada(id: string): void {
    const alertas = this.alertasPersonalizadas().filter((item) => item.id !== id)
    this.save(this.alertasKey(), alertas)
    this.alertasPersonalizadas.set(alertas)
  }

  private restore<T>(key: string): T[] {
    const raw = localStorage.getItem(key)
    if (!raw) return []

    try {
      return JSON.parse(raw) as T[]
    } catch {
      return []
    }
  }

  private save<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data))
  }

  private metasKey(): string {
    return `${this.metasKeyPrefix}_${this.usuarioKey()}`
  }

  private limitesKey(): string {
    return `${this.limitesKeyPrefix}_${this.usuarioKey()}`
  }

  private recurrentesKey(): string {
    return `${this.recurrentesKeyPrefix}_${this.usuarioKey()}`
  }

  private alertasKey(): string {
    return `${this.alertasKeyPrefix}_${this.usuarioKey()}`
  }

  private usuarioKey(): string {
    return this.auth.getUsuario()?.email?.toLowerCase() ?? "anonimo"
  }
}
