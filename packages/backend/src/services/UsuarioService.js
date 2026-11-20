import { NotFoundError, UnauthorizedError } from "../errors/AppError.js"

// Dueño del UsuarioRepository: el resto de los services pide los usuarios a éste.
// Tiene dos "caras": los métodos para los controllers devuelven DTOs; los métodos para otros services devuelven
// objetos de dominio (los datos que otro service necesita para seguir con su regla de negocio).
export class UsuarioService {
    constructor({ usuarioRepository }) {
        this.usuarioRepository = usuarioRepository
    }

    // DTO público de Usuario (lo que ve cualquiera: organizador de un evento, comprador, emisor de un mensaje...).
    // Es estático para que otros services lo reutilicen sin inyectarse entre sí.
    static toDTO(usuario) {
        return { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido }
    }

    // DTO del perfil propio: sólo lo ve el dueño de la cuenta (GET /auth/me y la respuesta de login/registro).
    static perfilToDTO(usuario) {
        return { ...UsuarioService.toDTO(usuario), email: usuario.email, rol: usuario.rol }
    }

    // ---------- para los controllers (DTOs) ----------

    obtenerPorId(id) {
        const usuario = this.usuarioRepository.buscarPorId(id)
        if (!usuario) throw new NotFoundError("Usuario no encontrado")
        return UsuarioService.toDTO(usuario)
    }

    // ---------- para otros services (objetos de dominio) ----------

    // El usuario que realiza la acción (su id sale del token). Si la cuenta ya no existe (ej: el servidor se reinició
    // y la memoria se vació), el token no sirve: 401.
    obtenerActor(usuarioId) {
        const usuario = this.usuarioRepository.buscarPorId(usuarioId)
        if (!usuario) throw new UnauthorizedError("La cuenta del token ya no existe")
        return usuario
    }

    existeEmail(email) {
        return this.usuarioRepository.existeEmail(email)
    }

    // { usuario, passwordHash } o null. Sólo lo usa AuthService para el login.
    buscarCredenciales(email) {
        return this.usuarioRepository.buscarCredencialesPorEmail(email)
    }

    registrar(usuario, passwordHash) {
        return this.usuarioRepository.registrar(usuario, passwordHash)
    }

    guardar(usuario) {
        return this.usuarioRepository.guardar(usuario)
    }
}
