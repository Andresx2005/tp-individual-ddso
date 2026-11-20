import { z } from "zod"
import { fechaIsoSchema, idDesdeTextoSchema, paginacionSchema } from "./comunes.js"
import { EstadoCompra } from "../domain/EstadoCompra.js"

const tipoEntradaSchema = z
    .object({
        nombre: z.string().trim().min(1, "El nombre del tipo de entrada es obligatorio").max(60),
        descripcion: z.string().trim().max(300).default(""),
        precio: z.number({ invalid_type_error: "El precio debe ser un número" }).min(0, "El precio no puede ser negativo"),
        cupo: z.number({ invalid_type_error: "El cupo debe ser un número" }).int("El cupo debe ser un entero").positive("El cupo debe ser mayor a 0")
    })
    .strict()

// La categoría viaja dentro del evento. Si ya existe una con ese nombre (sin distinguir mayúsculas ni acentos) se reutiliza.
const categoriaSchema = z
    .object({
        nombre: z
            .string()
            .trim()
            .min(3, "El nombre de la categoría debe tener al menos 3 caracteres")
            .max(60)
            .transform((nombre) => nombre.replace(/\s+/g, " ")), // "Música   en  vivo" -> "Música en vivo"
        descripcion: z.string().trim().max(300).default("")
    })
    .strict()

export const crearEventoBodySchema = z
    .object({
        nombre: z.string().trim().min(3, "El nombre debe tener al menos 3 caracteres").max(120),
        descripcion: z.string().trim().min(1, "La descripción es obligatoria").max(5000),
        categoria: categoriaSchema,
        fecha: fechaIsoSchema,
        multimedia: z.array(z.string().url("Cada elemento de multimedia debe ser una URL")).max(20).default([]),
        tiposEntrada: z.array(tipoEntradaSchema).min(1, "Debe haber al menos un tipo de entrada").max(20)
    })
    .strict()

export const buscarEventosQuerySchema = paginacionSchema
    .extend({
        q: z.string().trim().min(1).max(100).optional(),
        categoriaId: idDesdeTextoSchema.optional(),
        organizadorId: idDesdeTextoSchema.optional(),
        precioMin: z.coerce.number().min(0).optional(),
        precioMax: z.coerce.number().min(0).optional(),
        ordenarPor: z.enum(["precio", "fecha", "puntaje"]).default("fecha"),
        orden: z.enum(["asc", "desc"]).optional()
    })
    .refine((q) => q.precioMin === undefined || q.precioMax === undefined || q.precioMin <= q.precioMax, {
        message: "precioMin no puede ser mayor que precioMax",
        path: ["precioMin"]
    })

export const comprasDeEventoQuerySchema = z.object({
    estado: z.nativeEnum(EstadoCompra).optional()
})
