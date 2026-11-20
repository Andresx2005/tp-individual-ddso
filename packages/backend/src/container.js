// Composición manual de dependencias (Repository -> Service -> Controller).
import { JwtService } from "./auth/JwtService.js"
import { PasswordHasher } from "./auth/PasswordHasher.js"
import { TokensOpacos } from "./auth/TokensOpacos.js"
import { autorizar, crearAutenticar } from "./middlewares/autenticacion.js"
import { crearRepositorios } from "./repositories/crearRepositorios.js"
import { crearServicios } from "./servicios.js"

import { AuthService } from "./services/AuthService.js"

import { AuthController } from "./controllers/AuthController.js"
import { CategoriaController } from "./controllers/CategoriaController.js"
import { CompraController } from "./controllers/CompraController.js"
import { EventoController } from "./controllers/EventoController.js"
import { FavoritoController } from "./controllers/FavoritoController.js"
import { UsuarioController } from "./controllers/UsuarioController.js"

export function crearContainer({ jwtSecreto, jwtExpiraEn, refreshDias }) {
    const tokenService = new JwtService({ secreto: jwtSecreto, expiraEn: jwtExpiraEn }) // falla si el secreto falta o es corto
    const passwordHasher = new PasswordHasher()

    const repositories = crearRepositorios()
    const { usuarioService, categoriaService, eventoService, compraService, reseniaService, catalogoService, favoritoService } = crearServicios({ repositories })
    const authService = new AuthService({
        usuarioService,
        refreshTokenRepository: repositories.refreshTokenRepository,
        passwordHasher,
        tokenService,
        tokensOpacos: new TokensOpacos(),
        refreshDuracionMs: refreshDias * 24 * 60 * 60 * 1000
    })

    return {
        controllers: {
            authController: new AuthController({ authService }),
            usuarioController: new UsuarioController({ usuarioService }),
            favoritoController: new FavoritoController({ favoritoService }),
            categoriaController: new CategoriaController({ categoriaService }),
            eventoController: new EventoController({ eventoService, catalogoService, compraService, reseniaService }),
            compraController: new CompraController({ compraService })
        },
        middlewares: { autenticar: crearAutenticar(tokenService), autorizar },
        services: { compraService },
        // Expuestos para cargar los datos iniciales (src/seed)
        repositories,
        passwordHasher
    }
}
