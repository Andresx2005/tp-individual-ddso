// Los controllers sólo traducen HTTP <-> Service: leen la request, llaman al service (que ya devuelve DTOs)
// y arman la respuesta. Si algo falla, el error se propaga (Express 5 captura las promesas rechazadas)
// hasta el ErrorHandler.
export class UsuarioController {
    constructor({ usuarioService }) {
        this.usuarioService = usuarioService
    }

    obtenerPorId = (req, res) => {
        const data = this.usuarioService.obtenerPorId(req.validated.params.id)
        res.status(200).json({ status: "success", data })
    }
}
