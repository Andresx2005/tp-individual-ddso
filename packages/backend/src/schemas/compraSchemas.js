import { z } from "zod"
import { idSchema } from "./comunes.js"
import { EstadoCompra } from "../domain/EstadoCompra.js"
import { LONGITUD_MAXIMA_MENSAJE } from "../domain/Mensaje.js"

export const crearCompraBodySchema = z
    .object({
        eventoId: idSchema,
        tipoEntradaId: idSchema,
        cantidad: z.number({ invalid_type_error: "La cantidad debe ser un número" }).int("La cantidad debe ser un entero").positive("La cantidad debe ser mayor a 0")
    })
    .strict()

export const misComprasQuerySchema = z.object({
    estado: z.nativeEnum(EstadoCompra).optional()
})

export const enviarMensajeBodySchema = z
    .object({
        mensaje: z.string().trim().min(1, "El mensaje no puede estar vacío").max(LONGITUD_MAXIMA_MENSAJE)
    })
    .strict()
