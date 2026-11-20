import express from "express"
import { Rol } from "../domain/Rol.js"
import { validate } from "../middlewares/validate.js"
import { eventoIdParamsSchema } from "../schemas/comunes.js"

// "Mis favoritos": el usuario sale del token (header Authorization)
export function crearFavoritoRoutes(controller, { autenticar, autorizar }) {
    const router = express.Router()
    router.use(autenticar)
    router.use(autorizar(Rol.COMPRADOR)) // guardar favoritos es parte de la experiencia del comprador
    router.get("/", controller.listar)
    router.post("/:eventoId", validate({ params: eventoIdParamsSchema }), controller.agregar)
    router.delete("/:eventoId", validate({ params: eventoIdParamsSchema }), controller.quitar)
    return router
}
