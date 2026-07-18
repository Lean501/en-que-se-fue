export interface CategoriaResumen {
  categoriaId: string
  nombre: string
  color: string
  total: number
  porcentaje: number
  cantidad: number
}

export interface ResumenMensual {
  periodo: string // "2026-07"
  periodoLabel: string // "Julio 2026"
  totalGastado: number
  cantidadGastos: number
  promedioPorGasto: number
  categoriaTop: CategoriaResumen | null
  categorias: CategoriaResumen[]
  observaciones: string[]
  recomendaciones: string[]
  variacionMesAnterior: number | null // porcentaje
}
