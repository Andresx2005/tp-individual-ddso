import { z } from "zod"

// Los ids son enteros positivos autoincrementales (1, 2, 3...), generados por los repositorios.
export const idSchema = z.number({ invalid_type_error: "El id debe ser un número" }).int("El id debe ser un entero").positive("El id debe ser mayor a 0")

// En params y query los ids llegan como texto ("3"): se convierten a número.
export const idDesdeTextoSchema = z.coerce.number({ invalid_type_error: "El id debe ser un número" }).int("El id debe ser un entero").positive("El id debe ser mayor a 0")

export const idParamsSchema = z.object({ id: idDesdeTextoSchema })
export const eventoIdParamsSchema = z.object({ eventoId: idDesdeTextoSchema })

// Los query params llegan como string: se convierten con coerce.
export const paginacionSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10)
})

// Fecha ISO 8601 con zona horaria (ej: 2026-12-31T21:00:00-03:00) -> Date
export const fechaIsoSchema = z
    .string()
    .datetime({ offset: true, message: "La fecha debe estar en formato ISO 8601 (ej: 2026-12-31T21:00:00-03:00)" })
    .transform((valor) => new Date(valor))
