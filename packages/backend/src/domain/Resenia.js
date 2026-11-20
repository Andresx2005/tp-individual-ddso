// La escala de puntuación y el largo del comentario los hace cumplir Zod (schemas/reseniaSchemas.js).
export const PUNTUACION_MINIMA = 1
export const PUNTUACION_MAXIMA = 5

export class Resenia {
    id
    comprador
    evento
    detalle
    puntuacion
    creadaEn

    constructor({ id = null, comprador, evento, detalle, puntuacion, creadaEn }) {
        this.id = id
        this.comprador = comprador
        this.evento = evento
        this.detalle = detalle
        this.puntuacion = puntuacion
        this.creadaEn = creadaEn
    }
}
