import { computed, inject, Injectable, signal } from "@angular/core"
import { AuthService } from "./auth.service"

@Injectable({ providedIn: "root" })
export class NotificationService {
  private auth = inject(AuthService)
  private readonly readKeyPrefix = "pagos_admin_notificaciones_leidas"

  readonly alertas = signal<string[]>([])
  readonly leidas = signal<string[]>(this.restoreLeidas())
  readonly noLeidas = computed(() => this.alertas().filter((alerta) => !this.leidas().includes(alerta)))

  setAlertas(alertas: string[]): void {
    const unicas = [...new Set(alertas)]
    this.alertas.set(unicas)

    const leidasActuales = this.leidas().filter((alerta) => unicas.includes(alerta))
    if (leidasActuales.length !== this.leidas().length) {
      this.saveLeidas(leidasActuales)
    }
  }

  marcarComoLeida(alerta: string): void {
    if (this.leidas().includes(alerta)) return
    this.saveLeidas([...this.leidas(), alerta])
  }

  marcarTodasComoLeidas(): void {
    this.saveLeidas(this.alertas())
  }

  private restoreLeidas(): string[] {
    const raw = localStorage.getItem(this.readKey())
    if (!raw) return []

    try {
      return JSON.parse(raw) as string[]
    } catch {
      return []
    }
  }

  private saveLeidas(leidas: string[]): void {
    localStorage.setItem(this.readKey(), JSON.stringify(leidas))
    this.leidas.set(leidas)
  }

  private readKey(): string {
    const email = this.auth.getUsuario()?.email?.toLowerCase() ?? "anonimo"
    return `${this.readKeyPrefix}_${email}`
  }
}
