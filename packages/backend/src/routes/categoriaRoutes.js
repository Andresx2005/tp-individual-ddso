import express from "express"

// El catálogo de categorías es público y de sólo lectura (se carga manualmente en la base).
export function crearCategoriaRoutes(controller) {
    const router = express.Router()
    router.get("/", controller.listar)
    return router
}
