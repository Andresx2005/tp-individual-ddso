import { ConflictError } from "../errors/AppError.js"

export class ReseniaRepository {
    constructor() {
        this.resenias = []
        this.nextId = 1
    }

    // Hace cumplir "una reseña por comprador y evento" (el equivalente en memoria a un índice único).
    guardar(resenia) {
        if (this.existe(resenia.comprador.id, resenia.evento.id)) {
            throw new ConflictError("Ya reseñaste este evento")
        }
        resenia.id = this.nextId++
        this.resenias.push(resenia)
        return resenia
    }

    existe(compradorId, eventoId) {
        return this.resenias.some((r) => String(r.comprador.id) === String(compradorId) && String(r.evento.id) === String(eventoId))
    }

    // Reseñas que recibió un organizador en TODOS sus eventos, las más recientes primero.
    listarPorOrganizador(organizadorId, { pagina, limite }) {
        const todas = this.resenias
            .filter((r) => String(r.evento.organizador.id) === String(organizadorId))
            .sort((a, b) => b.creadaEn - a.creadaEn || Number(b.id) - Number(a.id))
        return { resenias: todas.slice((pagina - 1) * limite, pagina * limite), total: todas.length }
    }

    // Reputación = promedio de las puntuaciones de todas las reseñas del organizador (null si todavía no tiene).
    reputacionDeOrganizador(organizadorId) {
        const suyas = this.resenias.filter((r) => String(r.evento.organizador.id) === String(organizadorId))
        if (suyas.length === 0) return { promedio: null, cantidad: 0 }
        const promedio = suyas.reduce((suma, r) => suma + r.puntuacion, 0) / suyas.length
        return { promedio: Math.round(promedio * 100) / 100, cantidad: suyas.length }
    }
}
