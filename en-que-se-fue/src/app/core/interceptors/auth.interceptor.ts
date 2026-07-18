import type { HttpInterceptorFn } from "@angular/common/http"
import { inject } from "@angular/core"
import { AuthService } from "../services/auth.service"

/** Agrega el token Bearer a cada petición saliente. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const token = authService.getToken()
  const usuario = authService.getUsuario()
  if (!token) return next(req)

  const authReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
      "X-User-Email": usuario?.email ?? "",
    },
  })
  return next(authReq)
}
