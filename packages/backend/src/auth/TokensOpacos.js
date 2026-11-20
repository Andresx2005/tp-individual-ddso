import { createHash, randomBytes, randomUUID } from "node:crypto"

// Refresh tokens "opacos": a diferencia del access token (un JWT con datos adentro), son un texto aleatorio sin
// significado propio. La seguridad está en que son imposibles de adivinar (256 bits aleatorios) y en que el servidor
// sólo guarda su hash. Usa únicamente el módulo crypto de Node: no depende de librerías externas.
export class TokensOpacos {
    generar() {
        return randomBytes(32).toString("base64url")
    }

    // SHA-256 alcanza (no hace falta bcrypt): el token ya es aleatorio y de alta entropía, no una contraseña elegida por una persona.
    hashear(token) {
        return createHash("sha256").update(token).digest("hex")
    }

    generarFamilia() {
        return randomUUID()
    }
}
