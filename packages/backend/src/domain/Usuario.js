import { Rol } from "./Rol.js"

// Datos del usuario y su comportamiento propio. Las reglas que involucran a otras entidades, al rol de quien actúa o a
// la fecha (quién puede hacer qué) las resuelven los services; la validación de formatos, Zod.
export class Usuario {
    id
    nombre
    apellido
    email // identifica la cuenta al iniciar sesión (no es parte del diagrama: se agregó con la autenticación)
    rol
    // Eventos favoritos: objetos Evento (como en el diagrama), no ids.
    favoritos

    constructor({ id = null, nombre, apellido, email, rol, favoritos = [] }) {
        this.id = id
        this.nombre = nombre
        this.apellido = apellido
        this.email = email
        this.rol = rol
        this.favoritos = [...favoritos]
    }

    esComprador() {
        return this.rol === Rol.COMPRADOR
    }

    esOrganizador() {
        return this.rol === Rol.ORGANIZADOR
    }

    tieneFavorito(eventoId) {
        return this.favoritos.some((e) => String(e.id) === String(eventoId))
    }

    // Idempotente: agregar un favorito que ya existe no es un error.
    agregarFavorito(evento) {
        if (!this.tieneFavorito(evento.id)) this.favoritos.push(evento)
    }

    quitarFavorito(eventoId) {
        this.favoritos = this.favoritos.filter((e) => String(e.id) !== String(eventoId))
    }
}
