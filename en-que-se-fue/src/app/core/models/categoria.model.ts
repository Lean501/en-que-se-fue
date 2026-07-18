export interface Categoria {
  id: string
  nombre: string
  color: string
  descripcion?: string
}

export type CategoriaInput = Omit<Categoria, "id">
