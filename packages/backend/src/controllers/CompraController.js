export class CompraController {
    constructor({ compraService }) {
        this.compraService = compraService
    }

    crear = (req, res) => {
        const data = this.compraService.crear(req.usuarioId, req.validated.body)
        res.status(201).json({ status: "success", data })
    }

    listarMias = (req, res) => {
        const data = this.compraService.listarDeComprador(req.usuarioId, req.validated.query)
        res.status(200).json({ status: "success", data })
    }

    obtenerPorId = (req, res) => {
        const data = this.compraService.obtenerPorId(req.usuarioId, req.validated.params.id)
        res.status(200).json({ status: "success", data })
    }

    confirmarPago = (req, res) => {
        const data = this.compraService.confirmarPago(req.usuarioId, req.validated.params.id)
        res.status(200).json({ status: "success", data })
    }

    cancelar = (req, res) => {
        const data = this.compraService.cancelar(req.usuarioId, req.validated.params.id)
        res.status(200).json({ status: "success", data })
    }

    enviarMensaje = (req, res) => {
        const data = this.compraService.enviarMensaje(req.usuarioId, req.validated.params.id, req.validated.body.mensaje)
        res.status(201).json({ status: "success", data })
    }

    listarMensajes = (req, res) => {
        const data = this.compraService.obtenerMensajes(req.usuarioId, req.validated.params.id)
        res.status(200).json({ status: "success", data })
    }

    obtenerHistorial = (req, res) => {
        const data = this.compraService.obtenerHistorial(req.usuarioId, req.validated.params.id)
        res.status(200).json({ status: "success", data })
    }
}
