import { EstadoCompra } from "../domain/EstadoCompra.js"

const masRecientesPrimero = (a, b) => b.creadaEn - a.creadaEn || Number(b.id) - Number(a.id)

export class CompraRepository {
    constructor() {
        this.compras = new Map() // id -> Compra
        this.nextId = 1
        this.nextMensajeId = 1
    }

    // Crea (asignando id a la compra y a los mensajes nuevos de su chat) o actualiza.
    guardar(compra) {
        if (compra.id == null) compra.id = this.nextId++
        for (const mensaje of compra.mensajes) mensaje.id ??= this.nextMensajeId++
        this.compras.set(String(compra.id), compra)
        return compra
    }

    buscarPorId(id) {
        return this.compras.get(String(id)) ?? null
    }

    buscarPorComprador(compradorId, { estado } = {}) {
        return [...this.compras.values()]
            .filter((c) => String(c.comprador.id) === String(compradorId) && (!estado || c.estado === estado))
            .sort(masRecientesPrimero)
    }

    buscarPorEvento(eventoId, { estado } = {}) {
        return [...this.compras.values()]
            .filter((c) => String(c.evento.id) === String(eventoId) && (!estado || c.estado === estado))
            .sort(masRecientesPrimero)
    }

    existeUtilizada(compradorId, eventoId) {
        return [...this.compras.values()].some(
            (c) =>
                String(c.comprador.id) === String(compradorId) &&
                String(c.evento.id) === String(eventoId) &&
                c.estado === EstadoCompra.UTILIZADA
        )
    }

    // Compras abiertas (PENDIENTE o CONFIRMADA) cuyo evento ya llegó a su fecha: hay que cerrarlas.
    buscarAbiertasDeEventosRealizados(ahora) {
        return [...this.compras.values()].filter(
            (c) => (c.estado === EstadoCompra.PENDIENTE || c.estado === EstadoCompra.CONFIRMADA) && c.evento.estaRealizado(ahora)
        )
    }
}
