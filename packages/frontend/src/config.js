// Configuración central. La URL del backend se define en .env (EXPO_PUBLIC_API_URL).
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:3000/api").replace(/\/+$/, "")
export const REQUEST_TIMEOUT_MS = 15000
export const CHAT_POLL_MS = 8000 // el backend no tiene websockets: el chat consulta cada 8 s mientras está en pantalla
export const PAGE_SIZE = 10
