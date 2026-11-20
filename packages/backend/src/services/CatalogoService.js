import { EventoService } from "./EventoService.js"
import { ReseniaService } from "./ReseniaService.js"
import { paginacionToDTO } from "./helpers.js"

// Cómo se ordena cada criterio y en qué sentido por defecto (1 = ascendente, -1 = descendente).
const CRITERIOS_DE_ORDEN = {
    fecha: { valor: (item) => item.evento.fecha.getTime(), direccionPorDefecto: 1 }, // los más próximos primero
    precio: { valor: (item) => item.precioMinimo, direccionPorDefecto: 1 }, // los más baratos primero
    puntaje: { valor: (item) => item.reputacion.promedio ?? 0, direccionPorDefecto: -1 } // mejor puntuados primero; sin reseñas = 0
}

// Vistas de lectura que combinan eventos con la reputación de su organizador (explorar, buscar, ver el detalle).
// No tiene repositorio propio: junta lo que le dan EventoService y ReseniaService. Vive aparte porque EventoService
// no puede depender de ReseniaService (ReseniaService ya depende de EventoService) sin que se forme un ciclo.
export class CatalogoService {
    constructor({ eventoService, reseniaService }) {
        this.eventoService = eventoService
        this.reseniaService = reseniaService
    }

    // Caso de uso: el comprador busca (texto) o explora (categoría) y ordena por precio, fecha o puntaje del organizador.
    buscar({ texto, categoriaId, organizadorId, precioMin, precioMax, ordenarPor = "fecha", orden, pagina = 1, limite = 10 } = {}) {
        const eventos = this.eventoService.buscarEventos({ texto, categoriaId, organizadorId, precioMin, precioMax })

        // La reputación se calcula una vez por organizador, no una vez por evento.
        const reputaciones = new Map()
        const items = eventos.map((evento) => {
            const idOrganizador = String(evento.organizador.id)
            if (!reputaciones.has(idOrganizador)) {
                reputaciones.set(idOrganizador, this.reseniaService.reputacionDeOrganizador(evento.organizador.id))
            }
            return { evento, reputacion: reputaciones.get(idOrganizador), precioMinimo: evento.precioMinimo() }
        })

        const criterio = CRITERIOS_DE_ORDEN[ordenarPor]
        const direccion = orden ? (orden === "asc" ? 1 : -1) : criterio.direccionPorDefecto
        items.sort(
            (a, b) =>
                (criterio.valor(a) - criterio.valor(b)) * direccion || // criterio elegido
                a.evento.fecha - b.evento.fecha || // desempate: el más próximo
                Number(a.evento.id) - Number(b.evento.id) // desempate final: estable
        )

        const paginaActual = items.slice((pagina - 1) * limite, pagina * limite)
        return {
            data: paginaActual.map(({ evento, reputacion, precioMinimo }) =>
                EventoService.toDTO(evento, { precioMinimo, organizadorReputacion: ReseniaService.reputacionToDTO(reputacion) })
            ),
            paginacion: paginacionToDTO({ pagina, limite, total: items.length })
        }
    }

    // Caso de uso: detalle de un evento con la reputación de su organizador.
    obtenerPorId(id) {
        const evento = this.eventoService.obtenerEvento(id)
        const reputacion = this.reseniaService.reputacionDeOrganizador(evento.organizador.id)
        return EventoService.toDTO(evento, { organizadorReputacion: ReseniaService.reputacionToDTO(reputacion) })
    }
}
