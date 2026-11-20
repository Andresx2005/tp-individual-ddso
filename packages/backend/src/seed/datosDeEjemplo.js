import { Usuario } from "../domain/Usuario.js"
import { Rol } from "../domain/Rol.js"
import { crearServicios } from "../servicios.js"

export const PASSWORD_DE_EJEMPLO = "password123"
const DIA = 24 * 60 * 60 * 1000

// Carga cuentas, eventos y compras de ejemplo. Corre al iniciar el servidor (los datos viven en memoria).
// El historial se reproduce USANDO LOS SERVICES, igual que lo haría la API, pero con un reloj simulado que "viaja en
// el tiempo": así los eventos pasados se crean cuando todavía eran futuros, y las compras, pagos y cierres quedan con
// sus fechas, estados, cupos e historial consistentes (no se inserta nada a mano). Requiere las categorías base cargadas.
export async function cargarDatosDeEjemplo({ repositories, passwordHasher }) {
    const hoy = new Date()
    let ahora = hoy
    const viajarA = (fecha) => { ahora = fecha }
    const hace = (dias) => new Date(hoy.getTime() - dias * DIA)
    const enDias = (dias) => new Date(hoy.getTime() + dias * DIA)

    // Services con el reloj simulado (comparten los repositorios con los del servidor).
    const { usuarioService, eventoService, compraService, reseniaService } = crearServicios({ repositories, reloj: () => ahora })

    // ---------- cuentas (todas con la misma contraseña; se guarda sólo su hash) ----------
    const passwordHash = await passwordHasher.hash(PASSWORD_DE_EJEMPLO)
    const cuenta = (nombre, apellido, email, rol) => usuarioService.registrar(new Usuario({ nombre, apellido, email, rol }), passwordHash)
    const ana = cuenta("Ana", "Organizadora", "ana@ticketit.com", Rol.ORGANIZADOR)
    const luis = cuenta("Luis", "Productor", "luis@ticketit.com", Rol.ORGANIZADOR)
    const carla = cuenta("Carla", "Compradora", "carla@ticketit.com", Rol.COMPRADOR)
    const diego = cuenta("Diego", "Comprador", "diego@ticketit.com", Rol.COMPRADOR)

    // ---------- eventos (se crean 40 días atrás: el de jazz, que fue hace 30 días, todavía era futuro) ----------
    viajarA(hace(40))
    const tipo = (nombre, precio, cupo, descripcion = "") => ({ nombre, precio, cupo, descripcion })
    const jazz = eventoService.crear(ana.id, {
        nombre: "Noche de Jazz (ya realizado)", descripcion: "Ciclo de jazz en vivo", categoria: { nombre: "Recitales" },
        fecha: hace(30), tiposEntrada: [tipo("General", 8000, 100)]
    })
    const rock = eventoService.crear(ana.id, {
        nombre: "Rock Nacional en el Estadio", descripcion: "Las mejores bandas de rock nacional", categoria: { nombre: "Recitales" },
        fecha: enDias(20), multimedia: ["https://example.com/rock.jpg"],
        tiposEntrada: [tipo("General", 15000, 500, "Campo"), tipo("Platea", 30000, 100), tipo("VIP", 60000, 20, "Acceso preferencial")]
    })
    const hamlet = eventoService.crear(luis.id, {
        nombre: "Hamlet", descripcion: "Clásico de Shakespeare en versión contemporánea", categoria: { nombre: "Obras de teatro" },
        fecha: enDias(7), tiposEntrada: [tipo("Popular", 12000, 80), tipo("Palco", 25000, 10)]
    })
    const festival = eventoService.crear(luis.id, {
        nombre: "Festival de Verano", descripcion: "Tres días de música electrónica", categoria: { nombre: "Festivales" },
        fecha: enDias(60), tiposEntrada: [tipo("Pase 1 día", 20000, 1000), tipo("Pase 3 días", 50000, 300)]
    })

    // ---------- historia de compras ----------
    const comprar = (comprador, evento, nombreTipo, cantidad) =>
        compraService.crear(comprador.id, { eventoId: evento.id, tipoEntradaId: evento.tiposEntrada.find((t) => t.nombre === nombreTipo).id, cantidad })
    const pagar = (comprador, compra) => compraService.confirmarPago(comprador.id, compra.id)

    // Antes del evento de jazz: Carla y Diego pagan; otra compra de Carla queda sin pagar.
    viajarA(hace(36))
    const entradaDeCarla = comprar(carla, jazz, "General", 2)
    pagar(carla, entradaDeCarla)
    viajarA(hace(35))
    const entradaDeDiego = comprar(diego, jazz, "General", 1)
    pagar(diego, entradaDeDiego)
    viajarA(hace(33))
    const pendienteDeCarla = comprar(carla, jazz, "General", 1)

    // Llega la fecha del evento de jazz: las pagadas quedan UTILIZADAS y la que nunca se pagó, CANCELADA (devuelve su entrada).
    viajarA(hace(30))
    compraService.cerrarComprasDeEventosRealizados()

    // Carla reseña el evento (le da reputación a Ana).
    viajarA(hace(29))
    reseniaService.crear(carla.id, jazz.id, { puntuacion: 5, detalle: "Excelente organización y sonido." })

    // Compras para un evento futuro: una confirmada con chat y una pendiente.
    viajarA(hace(2))
    const confirmada = comprar(carla, rock, "Platea", 2)
    pagar(carla, confirmada)
    viajarA(hace(1))
    compraService.enviarMensaje(carla.id, confirmada.id, "¿A qué hora abren las puertas?")
    compraService.enviarMensaje(ana.id, confirmada.id, "¡Hola Carla! Abrimos a las 18:00.")
    const pendiente = comprar(diego, rock, "General", 4)

    viajarA(hoy)
    return {
        cuentas: [ana, luis, carla, diego].map((u) => ({ id: u.id, email: u.email, rol: u.rol })),
        eventos: [jazz, rock, hamlet, festival].map((e) => ({ id: e.id, nombre: e.nombre, tipos: e.tiposEntrada.map((t) => `${t.id}=${t.nombre}`) })),
        compras: { entradaDeCarla: entradaDeCarla.id, entradaDeDiego: entradaDeDiego.id, pendienteDeCarla: pendienteDeCarla.id, confirmada: confirmada.id, pendiente: pendiente.id }
    }
}
