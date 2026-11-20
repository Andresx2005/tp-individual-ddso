export class TipoEntrada {
    id
    nombre
    descripcion
    precio
    cupo            // capacidad total definida por el organizador
    cupoDisponible  // lo que queda sin vender (las compras PENDIENTE/CONFIRMADA/UTILIZADA ocupan cupo)

    constructor({ id = null, nombre, descripcion = "", precio, cupo, cupoDisponible = cupo }) {
        this.id = id
        this.nombre = nombre
        this.descripcion = descripcion
        this.precio = precio
        this.cupo = cupo
        this.cupoDisponible = cupoDisponible
    }

    hayCupoPara(cantidad) {
        return cantidad <= this.cupoDisponible
    }

    // Descuenta entradas del cupo. Quien lo llama (CompraService) ya verificó con hayCupoPara que alcanzan: como todo
    // ocurre de corrido, sin interrupciones, dos compradores no pueden quedarse con las mismas entradas.
    reservar(cantidad) {
        this.cupoDisponible -= cantidad
    }

    // Devuelve entradas al cupo (compra cancelada o reembolsada). Nunca supera el cupo total.
    liberar(cantidad) {
        this.cupoDisponible = Math.min(this.cupo, this.cupoDisponible + cantidad)
    }

    entradasVendidas() {
        return this.cupo - this.cupoDisponible
    }
}
