import { api, unwrap } from "./client"

export const listarMisCompras = (estado) => api.get("/compras", { estado }).then(unwrap)
export const obtenerCompra = (id) => api.get(`/compras/${id}`).then(unwrap)
export const comprar = ({ eventoId, tipoEntradaId, cantidad }) => api.post("/compras", { eventoId, tipoEntradaId, cantidad }).then(unwrap)
export const confirmarPago = (id) => api.post(`/compras/${id}/confirmar-pago`).then(unwrap)
export const cancelarCompra = (id) => api.post(`/compras/${id}/cancelar`).then(unwrap)
export const historialDeCompra = (id) => api.get(`/compras/${id}/historial`).then(unwrap)

// Chat de la compra
export const listarMensajes = (id) => api.get(`/compras/${id}/mensajes`).then(unwrap)
export const enviarMensaje = (id, mensaje) => api.post(`/compras/${id}/mensajes`, { mensaje }).then(unwrap)
