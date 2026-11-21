import { API_URL, REQUEST_TIMEOUT_MS } from "../config"

// Cliente HTTP único de la app. Si el backend cambia (base URL, formato de error, auth),
// el cambio se hace acá y en los servicios de esta carpeta; las pantallas no tocan fetch.

export class ApiError extends Error {
    constructor(message, { status = 0, details = [], network = false } = {}) {
        super(message)
        this.name = "ApiError"
        this.status = status
        this.details = details
        this.network = network
    }
}

let tokens = null // { accessToken, refreshToken } (en memoria; la persistencia la maneja AuthContext)
let handlers = { onTokens: () => {}, onExpired: () => {} }
let refreshEnCurso = null

export const setTokens = (t) => { tokens = t }
export const getTokens = () => tokens
export const setSessionHandlers = (h) => { handlers = { ...handlers, ...h } }

// Respuesta de éxito del backend: { status: "success", data, paginacion? }
export const unwrap = (body) => (body && typeof body === "object" && "data" in body ? body.data : body)

function armarUrl(path, query) {
    const params = Object.entries(query ?? {})
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    return `${API_URL}${path}${params.length ? "?" + params.join("&") : ""}`
}

async function enviar(path, { method = "GET", body, query, auth = true } = {}) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    const headers = { Accept: "application/json" }
    if (body !== undefined) headers["Content-Type"] = "application/json"
    if (auth && tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`

    let res
    try {
        res = await fetch(armarUrl(path, query), {
            method, headers, body: body !== undefined ? JSON.stringify(body) : undefined, signal: controller.signal
        })
    } catch {
        throw new ApiError("No pudimos conectarnos con el servidor.", { network: true })
    } finally {
        clearTimeout(timer)
    }

    if (res.status === 204) return null
    let json = null
    try { json = await res.json() } catch { /* cuerpo vacío o no JSON */ }
    if (!res.ok) {
        throw new ApiError(json?.message || `Error ${res.status}`, { status: res.status, details: json?.details ?? [] })
    }
    return json
}

// Un solo refresh a la vez: si 3 requests reciben 401 juntas, comparten el mismo intento.
// (El refresh token rota y sólo sirve una vez: dos refresh en paralelo cerrarían la sesión por "robo".)
function renovarSesion() {
    if (!refreshEnCurso) {
        refreshEnCurso = enviar("/auth/refresh", { method: "POST", auth: false, body: { refreshToken: tokens.refreshToken } })
            .then((json) => {
                const sesion = unwrap(json)
                tokens = { accessToken: sesion.accessToken, refreshToken: sesion.refreshToken }
                return handlers.onTokens(sesion)
            })
            .finally(() => { refreshEnCurso = null })
    }
    return refreshEnCurso
}

export async function request(path, opciones = {}) {
    try {
        return await enviar(path, opciones)
    } catch (error) {
        const reintentable = error.status === 401 && opciones.auth !== false && tokens?.refreshToken
        if (!reintentable) throw error
        try {
            await renovarSesion()
        } catch (errorRefresh) {
            // Sólo cerramos sesión si el servidor rechazó el refresh; un corte de red no debe desloguear.
            if (!errorRefresh.network) handlers.onExpired()
            throw errorRefresh.network ? errorRefresh : error
        }
        return enviar(path, opciones)
    }
}

export const api = {
    get: (path, query, opciones) => request(path, { ...opciones, method: "GET", query }),
    post: (path, body, opciones) => request(path, { ...opciones, method: "POST", body }),
    delete: (path, opciones) => request(path, { ...opciones, method: "DELETE" })
}
