import { z } from "zod"
import { LONGITUD_MAXIMA_MENSAJE } from "../domain/Mensaje.js"
import { PUNTUACION_MAXIMA, PUNTUACION_MINIMA } from "../domain/Resenia.js"

export const crearReseniaBodySchema = z
    .object({
        puntuacion: z
            .number({ invalid_type_error: "La puntuación debe ser un número" })
            .min(PUNTUACION_MINIMA, `La puntuación mínima es ${PUNTUACION_MINIMA}`)
            .max(PUNTUACION_MAXIMA, `La puntuación máxima es ${PUNTUACION_MAXIMA}`),
        detalle: z.string().trim().min(1, "El comentario es obligatorio").max(LONGITUD_MAXIMA_MENSAJE)
    })
    .strict()
