import { EventoService } from "./EventoService.js"

// Eventos favoritos del comprador. No tiene repositorio propio: los favoritos son parte del Usuario, así que
// usa UsuarioService (para el usuario) y EventoService (para el evento). Vive aparte de UsuarioService porque
// devuelve eventos (usa EventoService.toDTO) y así UsuarioService queda sin dependencias de otros services.
export class FavoritoService {
    constructor({ usuarioService, eventoService }) {
        this.usuarioService = usuarioService
        this.eventoService = eventoService
    }

    listar(usuarioId) {
        const usuario = this.usuarioService.obtenerActor(usuarioId)
        return usuario.favoritos.map((evento) => EventoService.toDTO(evento))
    }

    agregar(usuarioId, eventoId) {
        const usuario = this.usuarioService.obtenerActor(usuarioId)
        const evento = this.eventoService.obtenerEvento(eventoId)

        usuario.agregarFavorito(evento)
        this.usuarioService.guardar(usuario)
        return EventoService.toDTO(evento)
    }

    quitar(usuarioId, eventoId) {
        const usuario = this.usuarioService.obtenerActor(usuarioId)
        usuario.quitarFavorito(eventoId)
        this.usuarioService.guardar(usuario)
    }
}
