import { ConflictError, ForbiddenError } from "../errors/AppError.js"
import { Resenia } from "../domain/Resenia.js"
import { UsuarioService } from "./UsuarioService.js"
import { paginacionToDTO } from "./helpers.js"

// Dueño del ReseniaRepository. El comprador y el evento se los pide a UsuarioService y EventoService, y si el
// comprador usó una entrada se lo pregunta a CompraService.
export class ReseniaService {
    constructor({ reseniaRepository, usuarioService, eventoService, compraService, reloj = () => new Date() }) {
        this.reseniaRepository = reseniaRepository
        this.usuarioService = usuarioService
        this.eventoService = eventoService
        this.compraService = compraService
        this.reloj = reloj
    }

    static toDTO(resenia) {
        return {
            id: resenia.id,
            puntuacion: resenia.puntuacion,
            detalle: resenia.detalle,
            comprador: UsuarioService.toDTO(resenia.comprador),
            evento: { id: resenia.evento.id, nombre: resenia.evento.nombre, fecha: resenia.evento.fecha },
            creadaEn: resenia.creadaEn
        }
    }

    // DTO de la reputación de un organizador (promedio de sus reseñas y cuántas tiene).
    static reputacionToDTO({ promedio, cantidad }) {
        return { promedio, cantidadResenias: cantidad }
    }

    // ---------- para los controllers (DTOs) ----------

    // Caso de uso: puntuar y comentar un evento. Sólo un COMPRADOR, y sólo quien efectivamente usó una entrada
    // del evento (una entrada UTILIZADA); una única reseña por comprador y evento.
    crear(compradorId, eventoId, { puntuacion, detalle }) {
        const comprador = this.usuarioService.obtenerActor(compradorId)
        if (!comprador.esComprador()) {
            throw new ForbiddenError("Sólo un usuario con rol COMPRADOR puede calificar eventos")
        }
        const evento = this.eventoService.obtenerEvento(eventoId)
        if (this.reseniaRepository.existe(comprador.id, evento.id)) {
            throw new ConflictError("Ya reseñaste este evento")
        }
        if (!this.compraService.tieneEntradaUtilizada(comprador.id, evento.id)) {
            throw new ForbiddenError("Sólo podés puntuar eventos a los que asististe (entrada utilizada)")
        }

        const resenia = new Resenia({ comprador, evento, detalle, puntuacion, creadaEn: this.reloj() })
        return ReseniaService.toDTO(this.reseniaRepository.guardar(resenia))
    }

    // Caso de uso: en la pantalla de un evento se muestra la reputación del organizador
    // y las reseñas que recibió en todos sus eventos anteriores.
    listarDelOrganizadorDelEvento(eventoId, { pagina = 1, limite = 10 } = {}) {
        const organizador = this.eventoService.obtenerEvento(eventoId).organizador
        const reputacion = this.reputacionDeOrganizador(organizador.id)
        const { resenias, total } = this.reseniaRepository.listarPorOrganizador(organizador.id, { pagina, limite })
        return {
            data: {
                organizador: UsuarioService.toDTO(organizador),
                reputacion: ReseniaService.reputacionToDTO(reputacion),
                resenias: resenias.map((r) => ReseniaService.toDTO(r))
            },
            paginacion: paginacionToDTO({ pagina, limite, total })
        }
    }

    // ---------- para otros services ----------

    // { promedio, cantidad }: promedio de las reseñas que recibió el organizador en todos sus eventos (null si no tiene).
    reputacionDeOrganizador(organizadorId) {
        return this.reseniaRepository.reputacionDeOrganizador(organizadorId)
    }
}
