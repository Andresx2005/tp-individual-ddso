import { EstadoCompra } from "./EstadoCompra.js"

const MS_POR_DIA = 24 * 60 * 60 * 1000

// Datos de la compra y comportamiento propio. Quién puede pagar, cancelar o chatear, qué transiciones de estado son
// válidas y cuándo se devuelve el cupo son reglas que resuelve CompraService (que también arma el CambioEstadoCompra).
export class Compra {
    id
    comprador
    evento
    tipoEntrada
    cantidad
    total
    estado
    mensajes
    creadaEn

    constructor({ id = null, comprador, evento, tipoEntrada, cantidad, total, estado = EstadoCompra.PENDIENTE, mensajes = [], creadaEn }) {
        this.id = id
        this.comprador = comprador
        this.evento = evento
        this.tipoEntrada = tipoEntrada
        this.cantidad = cantidad
        this.total = total
        this.estado = estado
        this.mensajes = [...mensajes]
        this.creadaEn = creadaEn
    }

    // Método del diagrama de clases.
    actualizarEstado(nuevoEstado) {
        this.estado = nuevoEstado
    }

    agregarMensaje(mensaje) {
        this.mensajes.push(mensaje)
    }

    // Los usuarios son siempre el mismo objeto (el repositorio en memoria devuelve la instancia guardada), así que alcanza con ===.
    esComprador(usuario) {
        return this.comprador === usuario
    }

    esOrganizador(usuario) {
        return this.evento.esOrganizador(usuario)
    }

    esParticipante(usuario) {
        return this.esComprador(usuario) || this.esOrganizador(usuario)
    }

    // Días que faltan para el evento. Sólo tiene sentido para compras CONFIRMADAS; en cualquier otro estado devuelve null.
    diasParaEvento(ahora = new Date()) {
        if (this.estado !== EstadoCompra.CONFIRMADA) return null
        const diferencia = this.evento.fecha.getTime() - ahora.getTime()
        return diferencia <= 0 ? 0 : Math.ceil(diferencia / MS_POR_DIA)
    }
}
