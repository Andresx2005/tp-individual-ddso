import { ConflictError, NotFoundError } from "../errors/AppError.js"

// Persistencia EN MEMORIA: los datos viven mientras el servidor esté corriendo y se pierden al reiniciarlo.
// Se guardan los objetos de dominio tal cual (sin copiarlos): buscarPorId devuelve el mismo objeto que se guardó,
// por eso los objetos pueden referenciarse entre sí directamente (Usuario.favoritos -> Evento, etc.).
export class UsuarioRepository {
    constructor() {
        this.usuarios = new Map() // id -> Usuario
        this.credenciales = new Map() // id -> passwordHash (aparte de la entidad, para que no pueda filtrarse a un DTO)
        this.idPorEmail = new Map() // índice único: email -> id
        this.nextId = 1
    }

    buscarPorId(id) {
        return this.usuarios.get(String(id)) ?? null
    }

    existeEmail(email) {
        return this.idPorEmail.has(email)
    }

    // Único lugar donde se lee el hash de la contraseña. Devuelve el usuario y el hash por separado.
    buscarCredencialesPorEmail(email) {
        const id = this.idPorEmail.get(email)
        if (id === undefined) return null
        return { usuario: this.usuarios.get(id), passwordHash: this.credenciales.get(id) }
    }

    // Alta de una cuenta. Hace cumplir la unicidad del email (el equivalente en memoria a un índice único).
    registrar(usuario, passwordHash) {
        if (this.idPorEmail.has(usuario.email)) {
            throw new ConflictError("Ya existe una cuenta con ese email")
        }
        usuario.id = this.nextId++
        const clave = String(usuario.id)
        this.usuarios.set(clave, usuario)
        this.credenciales.set(clave, passwordHash)
        this.idPorEmail.set(usuario.email, clave)
        return usuario
    }

    // Persiste los cambios de un usuario existente (nombre, favoritos...). Nunca toca email, rol ni credenciales.
    guardar(usuario) {
        if (!this.usuarios.has(String(usuario.id))) {
            throw new NotFoundError("Usuario no encontrado")
        }
        this.usuarios.set(String(usuario.id), usuario)
        return usuario
    }
}
