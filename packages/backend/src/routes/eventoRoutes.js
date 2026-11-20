import express from "express"
import { Rol } from "../domain/Rol.js"
import { validate } from "../middlewares/validate.js"
import { idParamsSchema, paginacionSchema } from "../schemas/comunes.js"
import { buscarEventosQuerySchema, comprasDeEventoQuerySchema, crearEventoBodySchema } from "../schemas/eventoSchemas.js"
import { crearReseniaBodySchema } from "../schemas/reseniaSchemas.js"

export function crearEventoRoutes(controller, { autenticar, autorizar }) {
    const router = express.Router()

    // Públicas (catálogo)
    router.get("/", validate({ query: buscarEventosQuerySchema }), controller.buscar)
    router.get("/:id", validate({ params: idParamsSchema }), controller.obtenerPorId)
    router.get("/:id/resenias", validate({ params: idParamsSchema, query: paginacionSchema }), controller.listarResenias)

    // Requieren token y el rol que corresponde al caso de uso
    router.post("/", autenticar, autorizar(Rol.ORGANIZADOR), validate({ body: crearEventoBodySchema }), controller.crear)
    router.get("/:id/compras", autenticar, autorizar(Rol.ORGANIZADOR), validate({ params: idParamsSchema, query: comprasDeEventoQuerySchema }), controller.listarCompras)
    router.post("/:id/resenias", autenticar, autorizar(Rol.COMPRADOR), validate({ params: idParamsSchema, body: crearReseniaBodySchema }), controller.crearResenia)

    return router
}
