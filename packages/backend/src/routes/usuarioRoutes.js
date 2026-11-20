import express from "express"
import { validate } from "../middlewares/validate.js"
import { idParamsSchema } from "../schemas/comunes.js"

export function crearUsuarioRoutes(controller, { autenticar }) {
    const router = express.Router()
    router.get("/:id", autenticar, validate({ params: idParamsSchema }), controller.obtenerPorId)
    return router
}
