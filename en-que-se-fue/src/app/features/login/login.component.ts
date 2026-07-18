import { Component, inject, signal } from "@angular/core"
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms"
import { Router } from "@angular/router"
import { RouterLink } from "@angular/router"
import { AuthService } from "../../core/services/auth.service"

@Component({
  selector: "app-login",
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrl: "./login.component.css",
})
export class LoginComponent {
  private fb = inject(FormBuilder)
  private auth = inject(AuthService)
  private router = inject(Router)

  readonly cargando = signal(false)
  readonly errorServidor = signal<string | null>(null)
  readonly verPassword = signal(false)

  readonly form = this.fb.nonNullable.group({
    email: ["", [Validators.required, Validators.email]],
    password: ["", [Validators.required, Validators.minLength(6)]],
  })

  get email() {
    return this.form.controls.email
  }
  get password() {
    return this.form.controls.password
  }

  togglePassword(): void {
    this.verPassword.update((v) => !v)
  }

  submit(): void {
    this.errorServidor.set(null)
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    this.cargando.set(true)
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.cargando.set(false)
        this.router.navigate(["/dashboard"])
      },
      error: (err) => {
        this.cargando.set(false)
        this.errorServidor.set(err?.error?.message ?? "No se pudo iniciar sesión. Intenta nuevamente.")
      },
    })
  }
}
