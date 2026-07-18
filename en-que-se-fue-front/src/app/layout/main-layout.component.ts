import { Component, type OnInit, inject, signal } from "@angular/core"
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms"
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from "@angular/router"
import { AuthService } from "../core/services/auth.service"
import { NotificationService } from "../core/services/notification.service"

@Component({
  selector: "app-main-layout",
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ReactiveFormsModule],
  templateUrl: "./main-layout.component.html",
  styleUrl: "./main-layout.component.css",
})
export class MainLayoutComponent implements OnInit {
  private fb = inject(FormBuilder)
  private auth = inject(AuthService)
  private router = inject(Router)
  private notificationService = inject(NotificationService)

  readonly usuario = this.auth.usuario
  readonly sidebarAbierta = signal(false)
  readonly notificacionesAbiertas = signal(false)
  readonly perfilAbierto = signal(false)
  readonly modalPerfilAbierto = signal(false)
  readonly guardandoPerfil = signal(false)
  readonly guardandoPassword = signal(false)
  readonly cerrandoSesion = signal(false)
  readonly perfilMensaje = signal("")
  readonly perfilError = signal("")
  readonly mostrarLeidas = signal(false)
  readonly alertas = this.notificationService.alertas
  readonly noLeidas = this.notificationService.noLeidas
  readonly leidas = this.notificationService.leidas

  readonly nav = [
    { path: "/dashboard", label: "Dashboard", icon: "M4 13h6V5H4zm10 6h6V5h-6zM4 19h6v-4H4z" },
    { path: "/gastos", label: "Gastos", icon: "M4 6h16M4 12h16M4 18h10" },
    { path: "/categorias", label: "Categorías", icon: "M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" },
    { path: "/presupuestos", label: "Presupuestos", icon: "M4 7h16M6 11h12M8 15h8M10 19h4" },
    { path: "/planificacion", label: "Planificación", icon: "M4 19V5M8 19v-6M12 19V9M16 19v-3M20 19V7" },
  ]

  readonly perfilForm = this.fb.nonNullable.group({
    nombre: ["", [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
  })

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ["", [Validators.required, Validators.minLength(6)]],
    newPassword: ["", [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
    repeatPassword: ["", [Validators.required, Validators.minLength(6)]],
  })

  ngOnInit(): void {
    this.auth.refrescarUsuario().subscribe({ error: () => undefined })
  }

  toggleSidebar(): void {
    this.sidebarAbierta.update((value) => !value)
  }

  cerrarSidebar(): void {
    this.sidebarAbierta.set(false)
  }

  togglePerfil(): void {
    this.perfilAbierto.update((value) => !value)
  }

  cerrarPerfil(): void {
    this.perfilAbierto.set(false)
  }

  abrirModalPerfil(): void {
    const usuario = this.usuario()
    this.perfilMensaje.set("")
    this.perfilError.set("")
    this.perfilForm.reset({ nombre: usuario?.nombre ?? "" })
    this.passwordForm.reset({ currentPassword: "", newPassword: "", repeatPassword: "" })
    this.modalPerfilAbierto.set(true)
    this.cerrarPerfil()
  }

  cerrarModalPerfil(): void {
    this.modalPerfilAbierto.set(false)
  }

  toggleNotificaciones(): void {
    this.notificacionesAbiertas.update((value) => !value)
  }

  cerrarNotificaciones(): void {
    this.notificacionesAbiertas.set(false)
  }

  marcarComoLeida(alerta: string): void {
    this.notificationService.marcarComoLeida(alerta)
  }

  marcarTodasComoLeidas(): void {
    this.notificationService.marcarTodasComoLeidas()
  }

  toggleMostrarLeidas(): void {
    this.mostrarLeidas.update((value) => !value)
  }

  iniciales(nombre: string): string {
    return nombre
      .split(" ")
      .map((parte) => parte[0])
      .slice(0, 2)
      .join("")
      .toUpperCase()
  }

  guardarNombre(): void {
    this.perfilMensaje.set("")
    this.perfilError.set("")
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched()
      return
    }

    this.guardandoPerfil.set(true)
    this.auth.actualizarPerfil(this.perfilForm.getRawValue()).subscribe({
      next: () => {
        this.guardandoPerfil.set(false)
        this.perfilMensaje.set("Nombre actualizado correctamente.")
      },
      error: (err) => {
        this.guardandoPerfil.set(false)
        this.perfilError.set(err?.error?.message ?? "No se pudo actualizar el nombre.")
      },
    })
  }

  guardarPassword(): void {
    this.perfilMensaje.set("")
    this.perfilError.set("")
    const data = this.passwordForm.getRawValue()
    if (this.passwordForm.invalid || data.newPassword !== data.repeatPassword) {
      this.passwordForm.markAllAsTouched()
      this.perfilError.set(data.newPassword !== data.repeatPassword ? "Las contraseñas nuevas no coinciden." : "")
      return
    }

    this.guardandoPassword.set(true)
    this.auth.actualizarPassword({ currentPassword: data.currentPassword, newPassword: data.newPassword }).subscribe({
      next: () => {
        this.guardandoPassword.set(false)
        this.passwordForm.reset({ currentPassword: "", newPassword: "", repeatPassword: "" })
        this.perfilMensaje.set("Contraseña actualizada correctamente.")
      },
      error: (err) => {
        this.guardandoPassword.set(false)
        this.perfilError.set(err?.error?.message ?? "No se pudo actualizar la contraseña.")
      },
    })
  }

  logout(): void {
    this.cerrandoSesion.set(true)
    this.cerrarPerfil()
    this.cerrarNotificaciones()
    this.cerrarSidebar()
    localStorage.setItem("pagos_admin_theme", "light")
    document.body.dataset["theme"] = "light"

    setTimeout(() => {
      this.auth.logout()
      this.router.navigate(["/login"])
    }, 350)
  }
}
