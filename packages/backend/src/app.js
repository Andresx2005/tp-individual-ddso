import cors from "cors"
import express from "express"
import swaggerUi from "swagger-ui-express"
import openapi from "./docs/openapi.js"
import { errorHandler } from "./middlewares/errorHandler.js"
import { errorLogger } from "./middlewares/errorLogger.js"
import { notFoundHandler } from "./middlewares/notFoundHandler.js"
import { crearRouter } from "./routes/router.js"

export function crearApp({ controllers, middlewares }) {
    const app = express()

    app.use(cors())
    app.use(express.json())

    // Documentación: Swagger UI en /api-docs y la especificación cruda en /api-docs.json
    app.get("/api-docs.json", (req, res) => res.json(openapi))
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapi, {
        customSiteTitle: "AI Ticket It - API",
        swaggerOptions: { persistAuthorization: true } // el token cargado en "Authorize" sobrevive a recargar la página
    }))

    app.use("/api", crearRouter(controllers, middlewares))

    app.use(notFoundHandler)
    app.use(errorLogger)
    app.use(errorHandler)

    return app
}
