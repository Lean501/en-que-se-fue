export interface AnalisisInteligente {
  titulo: string
  resumen: string
  recomendaciones: string[]
  fuente: "ollama" | "local" | string
  usandoIa: boolean
}
