import { z } from "zod"
import { camposDeUsuario, emailSchema } from "./usuarioSchemas.js"

// Registro = los datos del usuario + su contraseña.
export const registroBodySchema = z
    .object({
        ...camposDeUsuario,
        // 72 es el máximo que bcrypt procesa (el resto se ignoraría en silencio)
        password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72, "La contraseña no puede superar los 72 caracteres")
    })
    .strict()

export const loginBodySchema = z
    .object({
        email: emailSchema,
        password: z.string().min(1, "La contraseña es obligatoria").max(72)
    })
    .strict()

// El refresh token viaja en el BODY: el access token (que iría en el header) puede estar vencido justamente cuando se lo necesita.
export const refreshBodySchema = z
    .object({
        refreshToken: z.string().min(20, "refreshToken inválido").max(200, "refreshToken inválido")
    })
    .strict()
