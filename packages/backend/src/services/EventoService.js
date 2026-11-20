import { ForbiddenError, NotFoundError, UnprocessableEntityError } from "../errors/AppError.js"
import { Categoria } from "../domain/Categoria.js"
import { Evento } from "../domain/Evento.js"
import { TipoEntrada } from "../domain/TipoEntrada.js"
import { CategoriaService } from "./CategoriaService.js"
import { UsuarioService } from "./UsuarioService.js"

// Dueño del EventoRepository. Para buscar al organizador y la categoría le pide los datos a UsuarioService
// y a CategoriaService (no a sus repositorios).
export class EventoService {
    constructor({ eventoRepository, usuarioService, categoriaService, reloj = () => new Date() }) {
        this.eventoRepository = eventoRepository
        this.usuarioService = usuarioService
        this.categoriaService = categoriaService
        this.reloj = reloj
    }

    static tipoEntradaToDTO(tipo) {
        return {
            id: tipo.id,
            nombre: tipo.nombre,
            descripcion: tipo.descripcion,
            precio: tipo.precio,
            cupo: tipo.cupo,
            entradasVendidas: tipo.entradasVendidas(),
            entradasDisponibles: tipo.cupoDisponible
        }
    }

    // `extra` agrega campos propios de cada vista (ej: precioMinimo, organizadorReputacion).
    static toDTO(evento, extra = {}) {
        return {
            id: evento.id,
            nombre: evento.nombre,
            descripcion: evento.descripcion,
            categoria: CategoriaService.toDTO(evento.categoria),
            fecha: evento.fecha,
            multimedia: evento.multimedia,
            organizador: UsuarioService.toDTO(evento.organizador),
            tiposEntrada: evento.tiposEntrada.map((t) => EventoService.tipoEntradaToDTO(t)),
            ...extra
        }
    }

    // ---------- para los controllers (DTOs) ----------

    // Caso de uso: el organizador crea un evento con distintos tipos de entrada (precio y cupo cada uno).
    // La categoría viene en el body como objeto { nombre, descripcion? }. Si ya existe una con ese nombre (sin
    // distinguir mayúsculas ni acentos) el evento la reutiliza; si no, se crea. Así los eventos comparten
    // categorías (se puede explorar por ellas) y nadie necesita un rol especial para administrarlas.
    crear(organizadorId, { categoria: datosCategoria, tiposEntrada, ...datos }) {
        const organizador = this.usuarioService.obtenerActor(organizadorId)
        if (!organizador.esOrganizador()) {
            throw new ForbiddenError("Sólo un usuario con rol ORGANIZADOR puede crear eventos")
        }
        if (datos.fecha.getTime() <= this.reloj().getTime()) {
            throw new UnprocessableEntityError("La fecha del evento debe ser futura")
        }
        const nombres = tiposEntrada.map((t) => t.nombre.toLowerCase())
        if (new Set(nombres).size !== nombres.length) {
            throw new UnprocessableEntityError("No puede haber dos tipos de entrada con el mismo nombre")
        }

        // Con todo lo anterior validado recién se obtiene (o crea) la categoría: si algo falla antes, no se crea ninguna.
        const categoria = this.categoriaService.obtenerOCrear(new Categoria(datosCategoria))
        const evento = new Evento({ ...datos, categoria, organizador, tiposEntrada: tiposEntrada.map((t) => new TipoEntrada(t)) })
        return EventoService.toDTO(this.eventoRepository.guardar(evento))
    }

    // ---------- para otros services (objetos de dominio) ----------

    obtenerEvento(id) {
        const evento = this.eventoRepository.buscarPorId(id)
        if (!evento) throw new NotFoundError("Evento no encontrado")
        return evento
    }

    // Eventos futuros que cumplen los filtros. El orden y la paginación los resuelve CatalogoService.
    buscarEventos({ texto, categoriaId, organizadorId, precioMin, precioMax } = {}) {
        return this.eventoRepository.buscar({ texto, categoriaId, organizadorId, precioMin, precioMax, ahora: this.reloj() })
    }
}
