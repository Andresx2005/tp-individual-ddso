// Job periódico: al llegar la fecha de un evento, sus compras CONFIRMADAS pasan a UTILIZADA
// y sus compras PENDIENTES (nunca pagadas) pasan a CANCELADA y devuelven su cupo.
// Corre una vez al iniciar (cierra lo que corresponda de los datos cargados) y luego cada `intervaloMs`.
// Es un setInterval dentro del proceso para no sumar dependencias; en producción podría reemplazarse por un cron
// externo que llame al mismo caso de uso (CompraService.cerrarComprasDeEventosRealizados).
export function iniciarJobDeCierreDeCompras({ compraService, intervaloMs }) {
    const ejecutar = () => {
        try {
            const { utilizadas, canceladas } = compraService.cerrarComprasDeEventosRealizados()
            if (utilizadas + canceladas > 0) {
                console.log(`[job] Compras cerradas por fecha de evento: ${utilizadas} UTILIZADA(S), ${canceladas} CANCELADA(S)`)
            }
        } catch (error) {
            console.error("[job] Error al cerrar compras de eventos realizados:", error)
        }
    }

    ejecutar()
    const timer = setInterval(ejecutar, intervaloMs)
    timer.unref() // no impide que el proceso termine
    return () => clearInterval(timer)
}
