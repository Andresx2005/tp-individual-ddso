import { CatalogoService } from "./services/CatalogoService.js"
import { CategoriaService } from "./services/CategoriaService.js"
import { CompraService } from "./services/CompraService.js"
import { EventoService } from "./services/EventoService.js"
import { FavoritoService } from "./services/FavoritoService.js"
import { ReseniaService } from "./services/ReseniaService.js"
import { UsuarioService } from "./services/UsuarioService.js"

// Arma los services de negocio. Cada uno recibe SU repositorio y los otros services de los que necesita datos
// (nunca los repositorios ajenos). El orden importa: cada uno se crea después de aquellos de los que depende.
// `reloj` permite controlar "la fecha de hoy": el servidor usa la real, los datos de ejemplo y los tests una simulada.
export function crearServicios({ repositories, reloj = () => new Date() }) {
    const { usuarioRepository, categoriaRepository, eventoRepository, compraRepository, cambioEstadoCompraRepository, reseniaRepository } = repositories

    const usuarioService = new UsuarioService({ usuarioRepository })
    const categoriaService = new CategoriaService({ categoriaRepository })
    const eventoService = new EventoService({ eventoRepository, usuarioService, categoriaService, reloj })
    const compraService = new CompraService({ compraRepository, cambioEstadoCompraRepository, usuarioService, eventoService, reloj })
    const reseniaService = new ReseniaService({ reseniaRepository, usuarioService, eventoService, compraService, reloj })
    const catalogoService = new CatalogoService({ eventoService, reseniaService })
    const favoritoService = new FavoritoService({ usuarioService, eventoService })

    return { usuarioService, categoriaService, eventoService, compraService, reseniaService, catalogoService, favoritoService }
}
