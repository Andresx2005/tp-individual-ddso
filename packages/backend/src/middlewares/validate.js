import { ValidationError } from "../errors/AppError.js"

// validate({ body, query, params }) valida con Zod cada parte indicada de la request.
// En Express 5 req.query es de sólo lectura, por eso los datos ya validados y transformados
// quedan en req.validated.{body,query,params} y los controllers leen de ahí.
export function validate(schemas) {
    return (req, res, next) => {
        const validated = {}
        const detalles = []

        for (const parte of ["params", "query", "body"]) {
            const schema = schemas[parte]
            if (!schema) continue

            const resultado = schema.safeParse(parte === "body" ? req.body ?? {} : req[parte])
            if (resultado.success) {
                validated[parte] = resultado.data
            } else {
                for (const issue of resultado.error.issues) {
                    detalles.push({ en: parte, campo: issue.path.join("."), mensaje: issue.message })
                }
            }
        }

        if (detalles.length > 0) {
            return next(new ValidationError(detalles.map((d) => (d.campo ? `${d.campo}: ${d.mensaje}` : d.mensaje)).join(" | "), detalles))
        }
        req.validated = validated
        next()
    }
}
