// Estados de una compra. El estado NUNCA se comunica sólo con color: siempre ícono + texto.
export const ESTADOS = {
    PENDIENTE: {
        label: "Pendiente de pago", corto: "Pendiente", icon: "time-outline", bg: "#FFF1D0", fg: "#6B4200",
        ayuda: { COMPRADOR: "Confirmá el pago para asegurar tus entradas.", ORGANIZADOR: "El comprador todavía no pagó." }
    },
    CONFIRMADA: {
        label: "Confirmada", corto: "Confirmada", icon: "checkmark-circle", bg: "#DDF1E4", fg: "#0F5435",
        ayuda: { COMPRADOR: "Tu entrada está asegurada. Podés cancelarla hasta que se realice el evento.", ORGANIZADOR: "Pago confirmado." }
    },
    UTILIZADA: {
        label: "Utilizada", corto: "Utilizada", icon: "ticket", bg: "#E6E9F5", fg: "#2F3A7A",
        ayuda: { COMPRADOR: "Ya usaste esta entrada. ¡Contanos cómo te fue!", ORGANIZADOR: "La entrada ya fue utilizada." }
    },
    CANCELADA: {
        label: "Cancelada", corto: "Cancelada", icon: "close-circle", bg: "#FCE8E6", fg: "#8C1D18",
        ayuda: { COMPRADOR: "Esta compra fue cancelada. Las entradas volvieron a estar disponibles.", ORGANIZADOR: "Compra cancelada: las entradas volvieron al cupo." }
    },
    REEMBOLSADA: {
        label: "Reembolsada", corto: "Reembolsada", icon: "return-up-back", bg: "#E4EEF9", fg: "#174A82",
        ayuda: { COMPRADOR: "Cancelaste después de pagar: el importe fue reembolsado.", ORGANIZADOR: "Se reembolsó al comprador." }
    }
}

export const ORDEN_ESTADOS = ["PENDIENTE", "CONFIRMADA", "UTILIZADA", "CANCELADA", "REEMBOLSADA"]
