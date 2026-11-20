// Sesiones renovables, indexadas por el HASH del token (el token en claro nunca se guarda).
export class RefreshTokenRepository {
    constructor({ reloj = () => new Date() } = {}) {
        this.reloj = reloj
        this.porHash = new Map() // tokenHash -> RefreshToken
        this.nextId = 1
    }

    // Crea o actualiza. De paso descarta los tokens ya vencidos (reemplaza al TTL que tenía la base de datos).
    guardar(refreshToken, tokenHash) {
        this.#purgarVencidos()
        if (refreshToken.id == null) refreshToken.id = this.nextId++
        this.porHash.set(tokenHash, refreshToken)
        return refreshToken
    }

    buscarPorHash(tokenHash) {
        return this.porHash.get(tokenHash) ?? null
    }

    // Cierra una sesión completa: revoca todos los tokens de la familia.
    revocarFamilia(familia, ahora) {
        for (const token of this.porHash.values()) {
            if (token.familia === familia) token.revocar(ahora)
        }
    }

    #purgarVencidos() {
        const ahora = this.reloj()
        for (const [hash, token] of this.porHash) {
            if (token.estaVencido(ahora)) this.porHash.delete(hash)
        }
    }
}
