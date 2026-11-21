import { api, unwrap } from "./client"

// GET /eventos -> { items, paginacion }
export async function listarEventos(params) {
    const body = await api.get("/eventos", params)
    return { items: body.data ?? [], paginacion: body.paginacion }
}

export const obtenerEvento = (id) => api.get(`/eventos/${id}`).then(unwrap)
export const crearEvento = (payload) => api.post("/eventos", payload).then(unwrap)
export const listarCategorias = () => api.get("/categorias").then(unwrap)

// Organizador: compras del evento + cupo que queda por tipo de entrada.
export const comprasDeEvento = (id, estado) => api.get(`/eventos/${id}/compras`, { estado }).then(unwrap)

// GET /eventos/{id}/resenias -> { items, meta: { organizador, reputacion }, paginacion }
export async function reseniasDeEvento(id, { page, limit } = {}) {
    const body = await api.get(`/eventos/${id}/resenias`, { page, limit })
    const d = body.data ?? {}
    return { items: d.resenias ?? [], meta: { organizador: d.organizador, reputacion: d.reputacion }, paginacion: body.paginacion }
}

export const crearResenia = (eventoId, { puntuacion, detalle }) =>
    api.post(`/eventos/${eventoId}/resenias`, { puntuacion, detalle }).then(unwrap)
