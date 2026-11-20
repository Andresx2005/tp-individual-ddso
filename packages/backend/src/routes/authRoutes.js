import express from "express"
import { validate } from "../middlewares/validate.js"
import { loginBodySchema, refreshBodySchema, registroBodySchema } from "../schemas/authSchemas.js"

export function crearAuthRoutes(controller, { autenticar }) {
    const router = express.Router()
    router.post("/registro", validate({ body: registroBodySchema }), controller.registrar)
    router.post("/login", validate({ body: loginBodySchema }), controller.login)
    // /refresh y /logout son públicos a propósito: se usan justo cuando el access token venció; la credencial es el refresh token.
    router.post("/refresh", validate({ body: refreshBodySchema }), controller.refrescar)
    router.post("/logout", validate({ body: refreshBodySchema }), controller.logout)
    router.get("/me", autenticar, controller.perfil)
    return router
}
