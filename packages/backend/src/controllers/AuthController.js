export class AuthController {
    constructor({ authService }) {
        this.authService = authService
    }

    registrar = async (req, res) => {
        const data = await this.authService.registrar(req.validated.body)
        res.status(201).json({ status: "success", data })
    }

    login = async (req, res) => {
        const data = await this.authService.login(req.validated.body)
        res.status(200).json({ status: "success", data })
    }

    refrescar = (req, res) => {
        const data = this.authService.refrescar(req.validated.body)
        res.status(200).json({ status: "success", data })
    }

    logout = (req, res) => {
        this.authService.logout(req.validated.body)
        res.status(204).send()
    }

    perfil = (req, res) => {
        const data = this.authService.perfil(req.usuarioId) // req.usuarioId lo puso `autenticar` a partir del token
        res.status(200).json({ status: "success", data })
    }
}
