import express from "express"
import { Rol } from "../domain/Rol.js"
import { validate } from "../middlewares/validate.js"
import { idParamsSchema } from "../schemas/comunes.js"
import { crearCompraBodySchema, enviarMensajeBodySchema, misComprasQuerySchema } from "../schemas/compraSchemas.js"

export function crearCompraRoutes(controller, { autenticar, autorizar }) {
    const soloComprador = autorizar(Rol.COMPRADOR)
    const router = express.Router()
    router.use(autenticar)

    router.get("/", soloComprador, validate({ query: misComprasQuerySchema }), controller.listarMias)
    router.post("/", soloComprador, validate({ body: crearCompraBodySchema }), controller.crear)
    router.get("/:id", validate({ params: idParamsSchema }), controller.obtenerPorId)

    router.post("/:id/confirmar-pago", soloComprador, validate({ params: idParamsSchema }), controller.confirmarPago)
    router.post("/:id/cancelar", soloComprador, validate({ params: idParamsSchema }), controller.cancelar)

    router.get("/:id/mensajes", validate({ params: idParamsSchema }), controller.listarMensajes)
    router.post("/:id/mensajes", validate({ params: idParamsSchema, body: enviarMensajeBodySchema }), controller.enviarMensaje)
    router.get("/:id/historial", validate({ params: idParamsSchema }), controller.obtenerHistorial)

    return router
}
