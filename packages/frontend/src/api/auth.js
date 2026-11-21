import { api, unwrap } from "./client"

export const registro = (datos) => api.post("/auth/registro", datos, { auth: false }).then(unwrap)
export const login = (email, password) => api.post("/auth/login", { email, password }, { auth: false }).then(unwrap)
export const cerrarSesion = (refreshToken) => api.post("/auth/logout", { refreshToken }, { auth: false })
export const miPerfil = () => api.get("/auth/me").then(unwrap)
