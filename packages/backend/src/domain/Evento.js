export class Evento {
    id
    nombre
    descripcion
    categoria
    fecha
    tiposEntrada // objetos TipoEntrada
    multimedia
    organizador

    constructor({ id = null, nombre, descripcion, categoria, fecha, tiposEntrada, multimedia = [], organizador }) {
        this.id = id
        this.nombre = nombre
        this.descripcion = descripcion
        this.categoria = categoria
        this.fecha = fecha
        this.tiposEntrada = [...tiposEntrada]
        this.multimedia = [...multimedia]
        this.organizador = organizador
    }

    // El evento "entra" en el rango si al menos uno de sus tipos de entrada tiene un precio dentro de él.
    tuPrecioEstaEntre(minimo, maximo) {
        return this.tiposEntrada.some((t) => t.precio >= minimo && t.precio <= maximo)
    }

    precioMinimo() {
        return Math.min(...this.tiposEntrada.map((t) => t.precio))
    }

    // Desde su fecha y hora de inicio el evento "ya se realizó".
    estaRealizado(ahora = new Date()) {
        return this.fecha.getTime() <= ahora.getTime()
    }

    // Los usuarios son siempre el mismo objeto (el repositorio en memoria devuelve la instancia guardada), así que alcanza con ===.
    esOrganizador(usuario) {
        return this.organizador === usuario
    }
}
