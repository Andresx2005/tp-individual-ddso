// Convierte cualquier error en un mensaje entendible (heurística 9: ayudar a reconocer y recuperarse de errores).
export function mensajeDeError(error) {
    if (!error) return "Ocurrió un error inesperado."
    if (error.network) return "No pudimos conectarnos. Revisá tu conexión e intentá de nuevo."
    if (error.status >= 500) return "El servidor tuvo un problema. Probá de nuevo en unos minutos."
    return error.message || "Ocurrió un error inesperado."
}

// Errores de validación del backend (400) -> { "tiposEntrada.0.cupo": "mensaje" }
export function erroresPorCampo(error) {
    const out = {}
    for (const d of error?.details ?? []) if (d?.campo) out[d.campo] = d.mensaje
    return out
}
