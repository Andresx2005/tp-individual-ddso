import express from "express"
import { crearAuthRoutes } from "./authRoutes.js"
import { crearCategoriaRoutes } from "./categoriaRoutes.js"
import { crearCompraRoutes } from "./compraRoutes.js"
import { crearEventoRoutes } from "./eventoRoutes.js"
import { crearFavoritoRoutes } from "./favoritoRoutes.js"
import { crearUsuarioRoutes } from "./usuarioRoutes.js"

// `middlewares` = { autenticar, autorizar }: se inyectan a cada router para decidir qué rutas son públicas y cuáles no.
export function crearRouter(controllers, middlewares) {
    const router = express.Router()

    router.get("/health", (req, res) => res.status(200).json({ status: "success", data: { ok: true } }))
    router.use("/auth", crearAuthRoutes(controllers.authController, middlewares))
    router.use("/usuarios", crearUsuarioRoutes(controllers.usuarioController, middlewares))
    router.use("/favoritos", crearFavoritoRoutes(controllers.favoritoController, middlewares))
    router.use("/categorias", crearCategoriaRoutes(controllers.categoriaController, middlewares))
    router.use("/eventos", crearEventoRoutes(controllers.eventoController, middlewares))
    router.use("/compras", crearCompraRoutes(controllers.compraController, middlewares))

    return router
}
