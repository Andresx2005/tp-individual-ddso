import { normalizarTexto } from "../utils/texto.js"

export class EventoRepository {
    constructor() {
        this.eventos = new Map() // id -> Evento
        this.nextId = 1
        this.nextTipoEntradaId = 1
    }

    buscarPorId(id) {
        return this.eventos.get(String(id)) ?? null
    }

    // Crea (asignando id al evento y a sus tipos de entrada) o actualiza.
    guardar(evento) {
        if (evento.id == null) evento.id = this.nextId++
        for (const tipo of evento.tiposEntrada) tipo.id ??= this.nextTipoEntradaId++
        this.eventos.set(String(evento.id), evento)
        return evento
    }

    // Eventos que todavía no se realizaron y cumplen los filtros. El orden y la paginación los resuelve el service.
    buscar({ texto, categoriaId, organizadorId, precioMin = 0, precioMax = Number.MAX_SAFE_INTEGER, ahora = new Date() } = {}) {
        // La búsqueda de texto no distingue mayúsculas ni acentos y mira el nombre y la descripción del evento.
        const buscado = texto === undefined ? undefined : normalizarTexto(texto)
        return [...this.eventos.values()].filter(
            (evento) =>
                !evento.estaRealizado(ahora) &&
                (categoriaId === undefined || String(evento.categoria.id) === String(categoriaId)) &&
                (organizadorId === undefined || String(evento.organizador.id) === String(organizadorId)) &&
                (buscado === undefined || normalizarTexto(`${evento.nombre} ${evento.descripcion}`).includes(buscado)) &&
                evento.tuPrecioEstaEntre(precioMin, precioMax)
        )
    }
}
