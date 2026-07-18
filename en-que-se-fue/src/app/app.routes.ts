import type { Routes } from "@angular/router"
import { authGuard, guestGuard } from "./core/guards/auth.guard"

export const routes: Routes = [
  {
    path: "login",
    canActivate: [guestGuard],
    loadComponent: () => import("./features/login/login.component").then((m) => m.LoginComponent),
  },
  {
    path: "registro",
    canActivate: [guestGuard],
    loadComponent: () => import("./features/registro/registro.component").then((m) => m.RegistroComponent),
  },
  {
    path: "",
    canActivate: [authGuard],
    loadComponent: () => import("./layout/main-layout.component").then((m) => m.MainLayoutComponent),
    children: [
      { path: "", redirectTo: "dashboard", pathMatch: "full" },
      {
        path: "dashboard",
        loadComponent: () => import("./features/dashboard/dashboard.component").then((m) => m.DashboardComponent),
      },
      {
        path: "gastos",
        loadComponent: () => import("./features/gastos/gastos.component").then((m) => m.GastosComponent),
      },
      {
        path: "categorias",
        loadComponent: () =>
          import("./features/categorias/categorias.component").then((m) => m.CategoriasComponent),
      },
      {
        path: "presupuestos",
        loadComponent: () => import("./features/presupuestos/presupuestos.component").then((m) => m.PresupuestosComponent),
      },
      {
        path: "planificacion",
        loadComponent: () => import("./features/planificacion/planificacion.component").then((m) => m.PlanificacionComponent),
      },
    ],
  },
  { path: "**", redirectTo: "" },
]
