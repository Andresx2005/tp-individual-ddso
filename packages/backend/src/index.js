import { crearApp } from "./app.js"
import { config } from "./config/env.js"
import { crearContainer } from "./container.js"
import { iniciarJobDeCierreDeCompras } from "./jobs/cierreDeComprasJob.js"
import { cargarCategoriasBase } from "./seed/categoriasBase.js"
import { PASSWORD_DE_EJEMPLO, cargarDatosDeEjemplo } from "./seed/datosDeEjemplo.js"

try {
    const container = crearContainer({
        jwtSecreto: config.jwtSecret,
        jwtExpiraEn: config.jwtExpiresIn,
        refreshDias: config.refreshExpiresInDias
    })

    // Persistencia en memoria: al arrancar la base está vacía, así que se carga el catálogo de categorías
    // y, opcionalmente (CARGAR_DATOS_EJEMPLO), cuentas, eventos y compras de ejemplo.
    cargarCategoriasBase(container.repositories)
    if (config.cargarDatosEjemplo) {
        const resumen = await cargarDatosDeEjemplo(container)
        console.log(`\nDatos de ejemplo cargados. Todas las cuentas usan la contraseña "${PASSWORD_DE_EJEMPLO}":`)
        for (const c of resumen.cuentas) console.log(`  id ${c.id}  ${c.email.padEnd(20)} ${c.rol}`)
        console.log("Eventos:")
        for (const e of resumen.eventos) console.log(`  id ${e.id}  ${e.nombre}  (tipos de entrada: ${e.tipos.join(", ")})`)
    }

    crearApp(container).listen(config.port, () => {
        console.log(`\nAI Ticket It escuchando en http://localhost:${config.port}/api`)
        console.log(`Swagger UI en http://localhost:${config.port}/api-docs`)
        console.log("Los datos viven en memoria: se pierden al reiniciar el servidor.")
    })

    iniciarJobDeCierreDeCompras({ compraService: container.services.compraService, intervaloMs: config.jobIntervaloMs })
} catch (error) {
    console.error("No se pudo iniciar el servidor:", error)
    process.exit(1)
}
