import { Injectable, computed, signal } from "@angular/core"
import { HttpClient } from "@angular/common/http"
import { Observable, map, tap } from "rxjs"
import { environment } from "../../../environments/environment"
import type { ActualizarPassword, ActualizarPerfil, AuthResponse, Credenciales, RegistroUsuario, Usuario } from "../models/usuario.model"

const TOKEN_KEY = "pagos_admin_token"
const USER_KEY = "pagos_admin_user"

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`

  private readonly _usuario = signal<Usuario | null>(this.restoreUser())
  readonly usuario = this._usuario.asReadonly()
  readonly isAuthenticated = computed(() => this._usuario() !== null)

  constructor(private http: HttpClient) {}

  login(credenciales: Credenciales): Observable<AuthResponse> {
    return this.http.post<ApiLoginResponse>(`${this.api}/login`, {
      usuario: credenciales.email,
      password: credenciales.password,
    }).pipe(
      map((res) => this.fromApiResponse(res, credenciales.email)),
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.usuario))
        this._usuario.set(res.usuario)
      }),
    )
  }

  register(data: RegistroUsuario): Observable<AuthResponse> {
    return this.http.post<ApiLoginResponse>(`${this.api}/register`, data).pipe(
      map((res) => this.fromApiResponse(res, data.email, data.nombre)),
      tap((res) => {
        localStorage.setItem(TOKEN_KEY, res.token)
        localStorage.setItem(USER_KEY, JSON.stringify(res.usuario))
        this._usuario.set(res.usuario)
      }),
    )
  }

  refrescarUsuario(): Observable<AuthResponse> {
    return this.http.get<ApiLoginResponse>(`${this.api}/me`).pipe(
      map((res) => this.fromApiResponse(res, this._usuario()?.email ?? "")),
      tap((res) => {
        localStorage.setItem(USER_KEY, JSON.stringify(res.usuario))
        this._usuario.set(res.usuario)
      }),
    )
  }

  actualizarPerfil(data: ActualizarPerfil): Observable<AuthResponse> {
    return this.http.put<ApiLoginResponse>(`${this.api}/profile`, data).pipe(
      map((res) => this.fromApiResponse(res, this._usuario()?.email ?? "", data.nombre)),
      tap((res) => {
        localStorage.setItem(USER_KEY, JSON.stringify(res.usuario))
        this._usuario.set(res.usuario)
      }),
    )
  }

  actualizarPassword(data: ActualizarPassword): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.api}/password`, data)
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    this._usuario.set(null)
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  }

  getUsuario(): Usuario | null {
    return this._usuario()
  }

  private restoreUser(): Usuario | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as Usuario
    } catch {
      return null
    }
  }

  private fromApiResponse(res: ApiLoginResponse, email: string, nombre?: string): AuthResponse {
    const responseEmail = res.email || res.usuario || email
    const responseName = res.nombre || nombre || responseEmail.split("@")[0]

    return {
      token: res.token,
      usuario: {
        id: String(res.usuarioId || responseEmail),
        nombre: responseName,
        email: responseEmail,
      },
    }
  }
}

interface ApiLoginResponse {
  token: string
  usuario: string
  usuarioId?: number
  nombre?: string
  email?: string
}
