export interface PresupuestoMensual {
  id: string
  mes: number
  anio: number
  monto: number
  origenFondos?: string
}

export type PresupuestoMensualInput = Omit<PresupuestoMensual, "id">
