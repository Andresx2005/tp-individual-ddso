import { ConflictError, UnauthorizedError } from "../errors/AppError.js"
import { RefreshToken } from "../domain/RefreshToken.js"
import { Usuario } from "../domain/Usuario.js"
import { UsuarioService } from "./UsuarioService.js"

const MENSAJE_LOGIN_INVALIDO = "Email o contraseña incorrectos"
const MENSAJE_REFRESH_INVALIDO = "Refresh token inválido"

// Si un refresh token se vuelve a presentar dentro de esta ventana tras haber sido usado, se asume un doble pedido
// legítimo (dos pestañas, un reintento) y sólo se lo rechaza. Pasada la ventana, se trata como un robo.
const VENTANA_DE_GRACIA_MS = 10_000

// Registro, login, renovación de sesión, logout y perfil. Dueño del RefreshTokenRepository; los usuarios se los
// pide a UsuarioService. Otras dependencias inyectadas: `passwordHasher` (bcrypt), `tokenService` (JWT de acceso)
// y `tokensOpacos` (refresh tokens).
// Sólo registrar y login son async (bcrypt es asíncrono); el resto es sincrónico como los repositorios en memoria.
export class AuthService {
    #hashFicticio = null

    constructor({
        usuarioService,
        refreshTokenRepository,
        passwordHasher,
        tokenService,
        tokensOpacos,
        refreshDuracionMs,
        reloj = () => new Date()
    }) {
        this.usuarioService = usuarioService
        this.refreshTokenRepository = refreshTokenRepository
        this.passwordHasher = passwordHasher
        this.tokenService = tokenService
        this.tokensOpacos = tokensOpacos
        this.refreshDuracionMs = refreshDuracionMs
        this.reloj = reloj
    }

    // DTO de la sesión: access token (corto, va en el header Authorization) + refresh token (largo, sólo sirve para
    // pedir un access token nuevo) + el perfil del usuario.
    static sesionToDTO(usuario, { accessToken, expiraEnSegundos, refreshToken }) {
        return { accessToken, tipo: "Bearer", expiraEnSegundos, refreshToken, usuario: UsuarioService.perfilToDTO(usuario) }
    }

    // Caso de uso: crear una cuenta eligiendo el rol (COMPRADOR u ORGANIZADOR).
    async registrar({ nombre, apellido, email, password, rol }) {
        const usuario = new Usuario({ nombre, apellido, email, rol })
        if (this.usuarioService.existeEmail(usuario.email)) {
            throw new ConflictError("Ya existe una cuenta con ese email")
        }
        const passwordHash = await this.passwordHasher.hash(password)
        // (el repositorio vuelve a verificar la unicidad: durante el hash otro pedido pudo registrar el mismo email)
        const guardado = this.usuarioService.registrar(usuario, passwordHash)
        return this.#iniciarSesion(guardado)
    }

    // Caso de uso: iniciar sesión. Tanto si el email no existe como si la contraseña es incorrecta se responde
    // lo mismo, para que nadie pueda averiguar qué emails están registrados.
    async login({ email, password }) {
        const credenciales = this.usuarioService.buscarCredenciales(email)

        // Se compara siempre contra un hash (aunque el usuario no exista) para que la demora no delate si el email existe.
        const hash = credenciales?.passwordHash ?? (await this.#obtenerHashFicticio())
        const coincide = await this.passwordHasher.compare(password, hash)
        if (!credenciales || !coincide) {
            throw new UnauthorizedError(MENSAJE_LOGIN_INVALIDO)
        }
        return this.#iniciarSesion(credenciales.usuario)
    }

    // Caso de uso: renovar la sesión cuando venció el access token. ROTACIÓN: el refresh token usado se descarta y se
    // entrega uno nuevo, así cada refresh token sirve una sola vez.
    refrescar({ refreshToken }) {
        const ahora = this.reloj()
        const tokenHash = this.tokensOpacos.hashear(refreshToken)
        const registro = this.refreshTokenRepository.buscarPorHash(tokenHash)
        if (!registro) {
            throw new UnauthorizedError(MENSAJE_REFRESH_INVALIDO)
        }

        if (registro.fueRevocado()) {
            if (ahora - registro.revocadoEn <= VENTANA_DE_GRACIA_MS) {
                throw new UnauthorizedError("Este refresh token ya fue reemplazado: usá el más reciente")
            }
            // DETECCIÓN DE REUTILIZACIÓN: llegó un token que se usó hace rato (o cerrado por logout): alguien lo copió.
            // El dueño legítimo y el atacante tienen el mismo token, así que se cierra TODA la sesión.
            this.refreshTokenRepository.revocarFamilia(registro.familia, ahora)
            throw new UnauthorizedError("Este refresh token ya fue utilizado: por seguridad se cerró la sesión. Iniciá sesión nuevamente")
        }
        if (registro.estaVencido(ahora)) {
            throw new UnauthorizedError("El refresh token expiró: iniciá sesión nuevamente")
        }

        // Verificar y consumir el token ocurre de corrido (sin esperas en el medio): sólo un pedido puede gastarlo.
        registro.revocar(ahora)
        this.refreshTokenRepository.guardar(registro, tokenHash)

        // El usuario es el objeto guardado: el nuevo access token refleja su rol actual.
        return this.#iniciarSesion(registro.usuario, registro.familia)
    }

    // Caso de uso: cerrar sesión. Revoca toda la familia de tokens. Es idempotente y siempre "funciona": no revela
    // si el token existía. (El access token ya emitido sigue valiendo hasta que venza: por eso es de vida corta.)
    logout({ refreshToken }) {
        const registro = this.refreshTokenRepository.buscarPorHash(this.tokensOpacos.hashear(refreshToken))
        if (registro) {
            this.refreshTokenRepository.revocarFamilia(registro.familia, this.reloj())
        }
    }

    perfil(usuarioId) {
        return UsuarioService.perfilToDTO(this.usuarioService.obtenerActor(usuarioId))
    }

    // `familia` identifica la sesión: un login nuevo crea una; cada renovación continúa la misma.
    #iniciarSesion(usuario, familia = this.tokensOpacos.generarFamilia()) {
        const { token: accessToken, expiraEnSegundos } = this.tokenService.firmar({ usuarioId: usuario.id, rol: usuario.rol })

        const refreshToken = this.tokensOpacos.generar()
        const ahora = this.reloj()
        const emitido = new RefreshToken({ usuario, familia, expiraEn: new Date(ahora.getTime() + this.refreshDuracionMs), creadoEn: ahora })
        this.refreshTokenRepository.guardar(emitido, this.tokensOpacos.hashear(refreshToken))

        return AuthService.sesionToDTO(usuario, { accessToken, expiraEnSegundos, refreshToken })
    }

    async #obtenerHashFicticio() {
        this.#hashFicticio ??= await this.passwordHasher.hash("contraseña-ficticia-para-igualar-tiempos")
        return this.#hashFicticio
    }
}
