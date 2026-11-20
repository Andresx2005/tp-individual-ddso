export class EventoController {
    constructor({ eventoService, catalogoService, compraService, reseniaService }) {
        this.eventoService = eventoService
        this.catalogoService = catalogoService
        this.compraService = compraService
        this.reseniaService = reseniaService
    }

    crear = (req, res) => {
        const data = this.eventoService.crear(req.usuarioId, req.validated.body)
        res.status(201).json({ status: "success", data })
    }

    buscar = (req, res) => {
        // Traducción de los nombres de los query params HTTP a los del service
        const { q, page, limit, ...filtros } = req.validated.query
        const { data, paginacion } = this.catalogoService.buscar({ texto: q, pagina: page, limite: limit, ...filtros })
        res.status(200).json({ status: "success", data, paginacion })
    }

    obtenerPorId = (req, res) => {
        const data = this.catalogoService.obtenerPorId(req.validated.params.id)
        res.status(200).json({ status: "success", data })
    }

    listarCompras = (req, res) => {
        const data = this.compraService.listarDeEvento(req.usuarioId, req.validated.params.id, req.validated.query)
        res.status(200).json({ status: "success", data })
    }

    listarResenias = (req, res) => {
        const { page, limit } = req.validated.query
        const { data, paginacion } = this.reseniaService.listarDelOrganizadorDelEvento(req.validated.params.id, {
            pagina: page,
            limite: limit
        })
        res.status(200).json({ status: "success", data, paginacion })
    }

    crearResenia = (req, res) => {
        const data = this.reseniaService.crear(req.usuarioId, req.validated.params.id, req.validated.body)
        res.status(201).json({ status: "success", data })
    }
}
