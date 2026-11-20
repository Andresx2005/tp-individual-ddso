export const LONGITUD_MAXIMA_MENSAJE = 1000 // lo hace cumplir Zod

export class Mensaje {
    id
    usuario
    mensaje
    enviado

    constructor({ id = null, usuario, mensaje, enviado }) {
        this.id = id
        this.usuario = usuario
        this.mensaje = mensaje
        this.enviado = enviado
    }
}
