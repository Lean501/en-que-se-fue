export interface Usuario {
  id: string
  nombre: string
  email: string
}

export interface Credenciales {
  email: string
  password: string
}

export interface RegistroUsuario {
  nombre: string
  email: string
  password: string
}

export interface ActualizarPerfil {
  nombre: string
}

export interface ActualizarPassword {
  currentPassword: string
  newPassword: string
}

export interface AuthResponse {
  token: string
  usuario: Usuario
}
