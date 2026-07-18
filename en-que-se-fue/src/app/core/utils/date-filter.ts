import type { Gasto } from "../models/gasto.model"

export type DateFilterKey = "hoy" | "semana" | "mes" | "anterior" | "anio" | "personalizado" | "todos"

export interface DateFilterState {
  key: DateFilterKey
  desde?: string
  hasta?: string
}

export const DATE_FILTER_OPTIONS: { value: DateFilterKey; label: string }[] = [
  { value: "hoy", label: "Hoy" },
  { value: "semana", label: "Esta semana" },
  { value: "mes", label: "Este mes" },
  { value: "anterior", label: "Mes anterior" },
  { value: "anio", label: "Año actual" },
  { value: "personalizado", label: "Rango personalizado" },
  { value: "todos", label: "Todos" },
]

export function filterGastosByDate(gastos: Gasto[], state: DateFilterState): Gasto[] {
  const range = getDateRange(state)
  if (!range) return gastos

  return gastos.filter((gasto) => gasto.fecha >= range.desde && gasto.fecha <= range.hasta)
}

export function getDateRange(state: DateFilterState): { desde: string; hasta: string } | null {
  const today = startOfDay(new Date())

  if (state.key === "todos") return null
  if (state.key === "personalizado") {
    if (!state.desde || !state.hasta) return null
    return { desde: state.desde, hasta: state.hasta }
  }

  if (state.key === "hoy") {
    const date = toDateInput(today)
    return { desde: date, hasta: date }
  }

  if (state.key === "semana") {
    const start = new Date(today)
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { desde: toDateInput(start), hasta: toDateInput(end) }
  }

  if (state.key === "mes") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1)
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return { desde: toDateInput(start), hasta: toDateInput(end) }
  }

  if (state.key === "anterior") {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const end = new Date(today.getFullYear(), today.getMonth(), 0)
    return { desde: toDateInput(start), hasta: toDateInput(end) }
  }

  const start = new Date(today.getFullYear(), 0, 1)
  const end = new Date(today.getFullYear(), 11, 31)
  return { desde: toDateInput(start), hasta: toDateInput(end) }
}

export function toDateInput(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
