import { CambioEstadoCompraRepository } from "./CambioEstadoCompraRepository.js"
import { CategoriaRepository } from "./CategoriaRepository.js"
import { CompraRepository } from "./CompraRepository.js"
import { EventoRepository } from "./EventoRepository.js"
import { RefreshTokenRepository } from "./RefreshTokenRepository.js"
import { ReseniaRepository } from "./ReseniaRepository.js"
import { UsuarioRepository } from "./UsuarioRepository.js"

// Persistencia en memoria: cada repositorio guarda sus objetos mientras el servidor esté corriendo.
export function crearRepositorios({ reloj } = {}) {
    return {
        usuarioRepository: new UsuarioRepository(),
        categoriaRepository: new CategoriaRepository(),
        eventoRepository: new EventoRepository(),
        compraRepository: new CompraRepository(),
        cambioEstadoCompraRepository: new CambioEstadoCompraRepository(),
        reseniaRepository: new ReseniaRepository(),
        refreshTokenRepository: new RefreshTokenRepository({ reloj })
    }
}
