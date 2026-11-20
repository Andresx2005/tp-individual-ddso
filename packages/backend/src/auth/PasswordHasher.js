import bcrypt from "bcryptjs"

// Adaptador sobre bcryptjs. bcrypt genera un "salt" aleatorio por contraseña y es deliberadamente lento
// (el costo se regula con `rondas`), lo que encarece los ataques de fuerza bruta si se filtra la base.
export class PasswordHasher {
    constructor({ rondas = 10 } = {}) {
        this.rondas = rondas
    }

    hash(passwordPlano) {
        return bcrypt.hash(passwordPlano, this.rondas)
    }

    compare(passwordPlano, hash) {
        return bcrypt.compare(passwordPlano, hash)
    }
}
