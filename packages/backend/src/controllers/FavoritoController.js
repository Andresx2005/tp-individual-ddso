export class FavoritoController {
    constructor({ favoritoService }) {
        this.favoritoService = favoritoService
    }

    listar = (req, res) => {
        const data = this.favoritoService.listar(req.usuarioId)
        res.status(200).json({ status: "success", data })
    }

    agregar = (req, res) => {
        const data = this.favoritoService.agregar(req.usuarioId, req.validated.params.eventoId)
        res.status(200).json({ status: "success", data })
    }

    quitar = (req, res) => {
        this.favoritoService.quitar(req.usuarioId, req.validated.params.eventoId)
        res.status(204).send()
    }
}
