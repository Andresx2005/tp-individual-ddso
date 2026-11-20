export class CategoriaController {
    constructor({ categoriaService }) {
        this.categoriaService = categoriaService
    }

    listar = (req, res) => {
        const data = this.categoriaService.listar()
        res.status(200).json({ status: "success", data })
    }
}
