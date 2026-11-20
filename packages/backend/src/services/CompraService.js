import { ForbiddenError, NotFoundError } from "../errors/AppError.js"
import { CupoInsuficienteError, EventoYaRealizadoError, TransicionDeEstadoInvalidaError } from "../errors/ErroresDeNegocio.js"
import { Compra } from "../domain/Compra.js"
import { CambioEstadoCompra } from "../domain/CambioEstadoCompra.js"
import { ESTADOS_QUE_LIBERAN_CUPO, EstadoCompra, puedeTransicionar } from "../domain/EstadoCompra.js"
import { Mensaje } from "../domain/Mensaje.js"
import { EventoService } from "./EventoService.js"
import { UsuarioService } from "./UsuarioService.js"

const redondear = (n) => Math.round(n * 100) / 100

// Dueño del CompraRepository y del CambioEstadoCompraRepository (el historial es parte de la compra).
// El comprador y el evento se los pide a UsuarioService y EventoService.
export class CompraService {
    constructor({ compraRepository, cambioEstadoCompraRepository, usuarioService, eventoService, reloj = () => new Date() }) {
        this.compraRepository = compraRepository
        this.cambioEstadoCompraRepository = cambioEstadoCompraRepository
        this.usuarioService = usuarioService
        this.eventoService = eventoService
        this.reloj = reloj
    }

    static toDTO(compra, ahora = new Date()) {
        return {
            id: compra.id,
            estado: compra.estado,
            // Sólo se informa para compras CONFIRMADAS; en el resto de los estados es null.
            diasParaEvento: compra.diasParaEvento(ahora),
            evento: { id: compra.evento.id, nombre: compra.evento.nombre, fecha: compra.evento.fecha },
            comprador: UsuarioService.toDTO(compra.comprador),
            tipoEntrada: { id: compra.tipoEntrada.id, nombre: compra.tipoEntrada.nombre, precioUnitario: compra.total / compra.cantidad },
            cantidad: compra.cantidad,
            total: compra.total,
            cantidadMensajes: compra.mensajes.length,
            creadaEn: compra.creadaEn
        }
    }

    // Vista del organizador: compras del evento + entradas disponibles por tipo.
    static comprasDeEventoToDTO(evento, compras, ahora = new Date()) {
        return {
            evento: { id: evento.id, nombre: evento.nombre, fecha: evento.fecha },
            entradasPorTipo: evento.tiposEntrada.map((t) => EventoService.tipoEntradaToDTO(t)),
            compras: compras.map((c) => CompraService.toDTO(c, ahora))
        }
    }

    static mensajeToDTO(mensaje) {
        return {
            id: mensaje.id,
            usuario: UsuarioService.toDTO(mensaje.usuario),
            mensaje: mensaje.mensaje,
            enviado: mensaje.enviado
        }
    }

    static cambioEstadoToDTO(cambio) {
        return {
            estado: cambio.estado,
            quien: cambio.quien ? UsuarioService.toDTO(cambio.quien) : null, // null = lo hizo el sistema
            realizadoPorElSistema: cambio.esDelSistema(),
            fechaHora: cambio.fechaHora
        }
    }

    // ---------- para los controllers (DTOs) ----------

    // Caso de uso: comprar entradas de un tipo, sin superar el cupo disponible.
    crear(compradorId, { eventoId, tipoEntradaId, cantidad }) {
        const comprador = this.usuarioService.obtenerActor(compradorId)
        if (!comprador.esComprador()) {
            throw new ForbiddenError("Sólo un usuario con rol COMPRADOR puede comprar entradas")
        }
        const evento = this.eventoService.obtenerEvento(eventoId)
        const ahora = this.reloj()
        if (evento.estaRealizado(ahora)) {
            throw new EventoYaRealizadoError("No se pueden comprar entradas para un evento que ya se realizó")
        }
        const tipoEntrada = evento.tiposEntrada.find((t) => String(t.id) === String(tipoEntradaId))
        if (!tipoEntrada) {
            throw new NotFoundError("El tipo de entrada no pertenece a este evento")
        }

        // Verificar el cupo y descontarlo ocurre de corrido, sin ceder el control: dos compras simultáneas no pueden
        // quedarse con las mismas entradas. La compra PENDIENTE ya ocupa las entradas.
        if (!tipoEntrada.hayCupoPara(cantidad)) {
            throw new CupoInsuficienteError(`Cupo insuficiente para "${tipoEntrada.nombre}": quedan ${tipoEntrada.cupoDisponible} entradas disponibles`)
        }
        tipoEntrada.reservar(cantidad)

        const compra = new Compra({
            comprador,
            evento,
            tipoEntrada,
            cantidad,
            total: redondear(tipoEntrada.precio * cantidad),
            estado: EstadoCompra.PENDIENTE,
            creadaEn: ahora
        })
        this.compraRepository.guardar(compra)
        this.cambioEstadoCompraRepository.registrar(new CambioEstadoCompra({ compra, estado: compra.estado, quien: comprador, fechaHora: ahora }))
        return CompraService.toDTO(compra, ahora)
    }

    // Caso de uso: "mis compras" (el comprador ve estado y días restantes si está CONFIRMADA).
    listarDeComprador(compradorId, { estado } = {}) {
        const comprador = this.usuarioService.obtenerActor(compradorId)
        const ahora = this.reloj()
        return this.compraRepository.buscarPorComprador(comprador.id, { estado }).map((compra) => CompraService.toDTO(compra, ahora))
    }

    // Caso de uso: el organizador ve las compras de uno de sus eventos y las entradas que quedan por tipo.
    listarDeEvento(organizadorId, eventoId, { estado } = {}) {
        const organizador = this.usuarioService.obtenerActor(organizadorId)
        const evento = this.eventoService.obtenerEvento(eventoId)
        if (!evento.esOrganizador(organizador)) {
            throw new ForbiddenError("Sólo el organizador del evento puede ver sus compras")
        }
        const compras = this.compraRepository.buscarPorEvento(evento.id, { estado })
        return CompraService.comprasDeEventoToDTO(evento, compras, this.reloj())
    }

    obtenerPorId(usuarioId, compraId) {
        const { compra } = this.#cargarParticipante(usuarioId, compraId)
        return CompraService.toDTO(compra, this.reloj())
    }

    // Caso de uso: el comprador paga. PENDIENTE -> CONFIRMADA.
    confirmarPago(usuarioId, compraId) {
        const actor = this.usuarioService.obtenerActor(usuarioId)
        const compra = this.#obtenerCompra(compraId)
        if (!compra.esComprador(actor)) {
            throw new ForbiddenError("Sólo el comprador puede confirmar el pago de la compra")
        }
        const ahora = this.reloj()
        if (compra.evento.estaRealizado(ahora)) {
            throw new EventoYaRealizadoError("No se puede pagar una compra de un evento que ya se realizó")
        }
        this.#cambiarEstado(compra, EstadoCompra.CONFIRMADA, actor, ahora)
        return CompraService.toDTO(compra, ahora)
    }

    // Caso de uso: el comprador cancela. Si todavía no había pagado queda CANCELADA; si ya había pagado (CONFIRMADA)
    // se la reembolsa y queda REEMBOLSADA. No se puede si la entrada ya fue utilizada o si el evento ya se realizó.
    cancelar(usuarioId, compraId) {
        const actor = this.usuarioService.obtenerActor(usuarioId)
        const compra = this.#obtenerCompra(compraId)
        if (!compra.esComprador(actor)) {
            throw new ForbiddenError("Sólo el comprador puede cancelar la compra")
        }
        if (compra.estado === EstadoCompra.UTILIZADA) {
            throw new TransicionDeEstadoInvalidaError("No se puede cancelar una compra cuya entrada ya fue utilizada")
        }
        const destino = compra.estado === EstadoCompra.CONFIRMADA ? EstadoCompra.REEMBOLSADA : EstadoCompra.CANCELADA
        if (!puedeTransicionar(compra.estado, destino)) {
            throw new TransicionDeEstadoInvalidaError(`No se puede cancelar una compra en estado ${compra.estado}`)
        }
        const ahora = this.reloj()
        if (compra.evento.estaRealizado(ahora)) {
            throw new EventoYaRealizadoError("No se puede cancelar una compra de un evento que ya se realizó")
        }
        this.#cambiarEstado(compra, destino, actor, ahora)
        return CompraService.toDTO(compra, ahora)
    }

    // Casos de uso: comprador y organizador chatean dentro de la compra, en cualquier estado.
    // Sólo participan ellos dos (#cargarParticipante rechaza a cualquier otro con 403).
    enviarMensaje(usuarioId, compraId, texto) {
        const { compra, actor } = this.#cargarParticipante(usuarioId, compraId)
        const mensaje = new Mensaje({ usuario: actor, mensaje: texto, enviado: this.reloj() })
        compra.agregarMensaje(mensaje)
        this.compraRepository.guardar(compra) // asigna el id al mensaje nuevo
        return CompraService.mensajeToDTO(mensaje)
    }

    obtenerMensajes(usuarioId, compraId) {
        const { compra } = this.#cargarParticipante(usuarioId, compraId)
        return [...compra.mensajes].sort((a, b) => a.enviado - b.enviado).map((m) => CompraService.mensajeToDTO(m))
    }

    obtenerHistorial(usuarioId, compraId) {
        const { compra } = this.#cargarParticipante(usuarioId, compraId)
        return this.cambioEstadoCompraRepository.listarPorCompra(compra).map((c) => CompraService.cambioEstadoToDTO(c))
    }

    // Caso de uso automático (lo dispara el job periódico): al llegar la fecha del evento (se asume que dura un día),
    //  - las compras CONFIRMADAS pasan a UTILIZADA
    //  - las compras PENDIENTES (nunca pagadas) pasan a CANCELADA y devuelven su cupo.
    // Lo hace el sistema, no una persona: el cambio queda registrado con quien = null. Es idempotente:
    // una compra ya cerrada deja de ser candidata.
    cerrarComprasDeEventosRealizados() {
        const ahora = this.reloj()
        const resultado = { utilizadas: 0, canceladas: 0 }

        for (const compra of this.compraRepository.buscarAbiertasDeEventosRealizados(ahora)) {
            const destino = compra.estado === EstadoCompra.PENDIENTE ? EstadoCompra.CANCELADA : EstadoCompra.UTILIZADA
            this.#cambiarEstado(compra, destino, null, ahora)
            if (destino === EstadoCompra.CANCELADA) resultado.canceladas++
            else resultado.utilizadas++
        }
        return resultado
    }

    // ---------- para otros services ----------

    // ¿El comprador tiene alguna entrada UTILIZADA de este evento? (lo usa ReseniaService)
    tieneEntradaUtilizada(compradorId, eventoId) {
        return this.compraRepository.existeUtilizada(compradorId, eventoId)
    }

    // ---------- privados ----------

    #obtenerCompra(compraId) {
        const compra = this.compraRepository.buscarPorId(compraId)
        if (!compra) throw new NotFoundError("Compra no encontrada")
        return compra
    }

    #cargarParticipante(usuarioId, compraId) {
        const actor = this.usuarioService.obtenerActor(usuarioId)
        const compra = this.#obtenerCompra(compraId)
        if (!compra.esParticipante(actor)) {
            throw new ForbiddenError("No participás de esta compra")
        }
        return { compra, actor }
    }

    // Único lugar donde cambia el estado de una compra: valida la transición contra la máquina de estados, actualiza
    // la compra, devuelve el cupo si el nuevo estado lo libera (CANCELADA o REEMBOLSADA) y registra el CambioEstadoCompra
    // (quién lo hizo y cuándo). Validar y cambiar ocurre de corrido, así que dos pedidos simultáneos sobre la misma
    // compra se resuelven uno después del otro: el segundo ve el estado ya cambiado y la transición ya no es válida.
    #cambiarEstado(compra, nuevoEstado, quien, ahora) {
        if (!puedeTransicionar(compra.estado, nuevoEstado)) {
            throw new TransicionDeEstadoInvalidaError(`No se puede pasar una compra de ${compra.estado} a ${nuevoEstado}`)
        }
        compra.actualizarEstado(nuevoEstado)
        if (ESTADOS_QUE_LIBERAN_CUPO.includes(nuevoEstado)) {
            compra.tipoEntrada.liberar(compra.cantidad) // las entradas vuelven a estar a la venta
        }
        this.compraRepository.guardar(compra)
        this.cambioEstadoCompraRepository.registrar(new CambioEstadoCompra({ compra, estado: nuevoEstado, quien, fechaHora: ahora }))
    }
}
