export const EstadoCompra = Object.freeze({
    PENDIENTE: "PENDIENTE",
    CONFIRMADA: "CONFIRMADA",
    UTILIZADA: "UTILIZADA",
    CANCELADA: "CANCELADA",
    REEMBOLSADA: "REEMBOLSADA"
})

// Máquina de estados de una compra.
//  PENDIENTE   -> CONFIRMADA (pago) | CANCELADA (cancelada sin haber pagado)
//  CONFIRMADA  -> UTILIZADA (ingreso al evento) | REEMBOLSADA (cancelada y reembolsada)
//  Los demás son estados finales.
export const TRANSICIONES_PERMITIDAS = Object.freeze({
    [EstadoCompra.PENDIENTE]: [EstadoCompra.CONFIRMADA, EstadoCompra.CANCELADA],
    [EstadoCompra.CONFIRMADA]: [EstadoCompra.UTILIZADA, EstadoCompra.REEMBOLSADA],
    [EstadoCompra.UTILIZADA]: [],
    [EstadoCompra.CANCELADA]: [],
    [EstadoCompra.REEMBOLSADA]: []
})

// Estados en los que las entradas vuelven a estar disponibles para la venta.
export const ESTADOS_QUE_LIBERAN_CUPO = Object.freeze([EstadoCompra.CANCELADA, EstadoCompra.REEMBOLSADA])

export const puedeTransicionar = (desde, hacia) => TRANSICIONES_PERMITIDAS[desde]?.includes(hacia) ?? false
