export const environment = {
  production: false,
  /**
   * Base URL de la API REST externa.
   * En este preview se intercepta con un backend en memoria (mock.interceptor.ts).
   * Para conectar tu backend real, cambia esta URL y elimina el interceptor de app.config.ts.
   */
  apiUrl: "https://localhost:53367/api",
  /** Activa/desactiva el backend simulado en memoria. */
  useMockApi: false,
}
