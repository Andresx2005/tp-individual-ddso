export class CambioEstadoCompraRepository {
    constructor() {
        this.cambios = [] // log de sólo-agregado
        this.nextId = 1
    }

    registrar(cambio) {
        cambio.id = this.nextId++
        this.cambios.push(cambio)
        return cambio
    }

    // Cambios de una compra en orden cronológico. Cada uno referencia al objeto Compra.
    listarPorCompra(compra) {
        return this.cambios
            .filter((c) => String(c.compra.id) === String(compra.id))
            .sort((a, b) => a.fechaHora - b.fechaHora || Number(a.id) - Number(b.id))
    }
}
