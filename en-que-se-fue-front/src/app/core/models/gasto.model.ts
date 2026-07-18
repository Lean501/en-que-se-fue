export interface Gasto {
  id: string
  descripcion: string
  monto: number
  fecha: string // ISO date (YYYY-MM-DD)
  categoriaId: string
  metodoPago: MetodoPago
  tipoMonto: TipoMonto
  notas?: string
}

export type MetodoPago = "efectivo" | "tarjeta" | "transferencia"
export type TipoMonto = "fijo" | "variable"

export type GastoInput = Omit<Gasto, "id">

export interface GastoConCategoria extends Gasto {
  categoriaNombre: string
  categoriaColor: string
}
