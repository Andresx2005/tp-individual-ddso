// Registro de auditoría: qué compra pasó a qué estado, quién lo hizo y cuándo.
// `quien` es null cuando el cambio lo hizo el sistema (ej: la entrada pasa a UTILIZADA al llegar la fecha del evento).
export class CambioEstadoCompra {
    id
    compra
    estado
    quien
    fechaHora

    constructor({ id = null, compra, estado, quien = null, fechaHora }) {
        this.id = id
        this.compra = compra
        this.estado = estado
        this.quien = quien
        this.fechaHora = fechaHora
    }

    esDelSistema() {
        return this.quien === null
    }
}
