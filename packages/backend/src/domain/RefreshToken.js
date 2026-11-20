// Sesión renovable. El refresh token en sí (un texto aleatorio) NUNCA se guarda ni vive en el dominio: el repositorio
// sólo guarda su hash. Acá está lo que se sabe de él: de quién es, a qué sesión ("familia") pertenece y su vigencia.
//
// Cada vez que se usa para renovar, el token se descarta y se emite uno nuevo de la MISMA familia (rotación).
// Todos los tokens que descienden de un mismo login comparten familia: si se detecta que alguien reutiliza uno ya
// descartado (señal de robo), se revoca la familia entera y se cierra esa sesión (lo resuelve AuthService).
export class RefreshToken {
    id
    usuario
    familia
    expiraEn
    revocadoEn // null mientras no se haya usado, cerrado el logout o revocado la familia
    creadoEn

    constructor({ id = null, usuario, familia, expiraEn, revocadoEn = null, creadoEn }) {
        this.id = id
        this.usuario = usuario
        this.familia = familia
        this.expiraEn = expiraEn
        this.revocadoEn = revocadoEn
        this.creadoEn = creadoEn
    }

    estaVencido(ahora) {
        return this.expiraEn.getTime() <= ahora.getTime()
    }

    fueRevocado() {
        return this.revocadoEn !== null
    }

    // Marca el token como usado/cerrado. Si ya estaba revocado conserva la fecha original.
    revocar(ahora) {
        if (!this.fueRevocado()) this.revocadoEn = ahora
    }
}
