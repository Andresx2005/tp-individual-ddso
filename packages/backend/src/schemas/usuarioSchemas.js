import { z } from "zod"
import { Rol } from "../domain/Rol.js"

export const emailSchema = z.string().trim().toLowerCase().email("El email no tiene un formato válido").max(254)

// Los datos propios de un usuario. Hoy la única forma de crear uno es registrándose (ver authSchemas.js, que
// les suma la contraseña), pero se definen acá porque son los datos del Usuario, no del registro.
export const camposDeUsuario = {
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(60),
    apellido: z.string().trim().min(1, "El apellido es obligatorio").max(60),
    email: emailSchema,
    rol: z.nativeEnum(Rol, { errorMap: () => ({ message: `El rol debe ser ${Object.values(Rol).join(" o ")}` }) })
}
