import dotenv from "dotenv"

dotenv.config()

export const config = {
    port: Number(process.env.PORT) || 3000,
    // JWT: el secreto es obligatorio (JwtService falla al iniciar si falta o es corto). Usar unidades en el vencimiento: 15m, 1h, 7d.
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15m", // access token: corto
    refreshExpiresInDias: Number(process.env.REFRESH_TOKEN_EXPIRES_DIAS) || 7, // refresh token: largo
    // cada cuánto el job revisa eventos que ya llegaron a su fecha
    jobIntervaloMs: (Number(process.env.JOB_INTERVALO_MINUTOS) || 5) * 60 * 1000,
    // Los datos viven en memoria: al arrancar se puede cargar un set de ejemplo para tener con qué probar
    cargarDatosEjemplo: process.env.CARGAR_DATOS_EJEMPLO !== "false"
}
