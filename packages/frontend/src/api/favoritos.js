import { api, unwrap } from "./client"

export const listarFavoritos = () => api.get("/favoritos").then(unwrap)
export const agregarFavorito = (eventoId) => api.post(`/favoritos/${eventoId}`).then(unwrap)
export const quitarFavorito = (eventoId) => api.delete(`/favoritos/${eventoId}`)
