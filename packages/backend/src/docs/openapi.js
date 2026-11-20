// Especificación OpenAPI 3.0 de la API. Se sirve en /api-docs (Swagger UI) y /api-docs.json.
// test/openapi.test.js verifica que todas las rutas de src/routes estén documentadas y que los $ref existan.

const ref = (nombre) => ({ $ref: `#/components/schemas/${nombre}` })
const respuestaRef = (nombre) => ({ $ref: `#/components/responses/${nombre}` })
const paramRef = (nombre) => ({ $ref: `#/components/parameters/${nombre}` })
const objectId = (descripcion = "Id numérico (entero positivo, asignado por el servidor)") => ({ type: "integer", minimum: 1, example: 1, description: descripcion })
const fecha = (descripcion) => ({ type: "string", format: "date-time", description: descripcion })
const lista = (items) => ({ type: "array", items })

const exito = (descripcion, data, { paginado = false } = {}) => ({
    description: descripcion,
    content: {
        "application/json": {
            schema: {
                type: "object",
                properties: {
                    status: { type: "string", example: "success" },
                    data,
                    ...(paginado && { paginacion: ref("Paginacion") })
                }
            }
        }
    }
})

const cuerpo = (schema, descripcion) => ({ required: true, description: descripcion, content: { "application/json": { schema } } })
const conToken = [{ BearerAuth: [] }]

// Errores posibles de cada operación (siempre se documenta el formato de error común).
const errores = (...codigos) => {
    const nombres = { 400: "DatosInvalidos", 401: "NoIdentificado", 403: "Prohibido", 404: "NoEncontrado", 409: "Conflicto", 422: "ReglaDeNegocio" }
    return Object.fromEntries(codigos.map((c) => [String(c), respuestaRef(nombres[c])]))
}

const spec = {
    openapi: "3.0.3",
    info: {
        title: "AI Ticket It - API",
        version: "1.0.0",
        description:
            "API REST para publicar eventos y vender entradas.\n\n" +
            "## Autenticación (JWT + refresh token)\n" +
            "1. Creá una cuenta con `POST /auth/registro` (elegís el rol: `COMPRADOR` u `ORGANIZADOR`) o iniciá sesión con `POST /auth/login`. " +
            "Ambos devuelven **dos tokens**: `accessToken` (dura 15 minutos) y `refreshToken` (dura 7 días).\n" +
            "2. Hacé clic en **Authorize** y pegá el `accessToken` (sin escribir `Bearer`). Swagger lo enviará en el header " +
            "`Authorization: Bearer <token>` de cada request con candado 🔒.\n" +
            "3. Cuando el `accessToken` venza (**401**), pedí uno nuevo con `POST /auth/refresh` enviando el `refreshToken` **en el body**. " +
            "Devuelve un par de tokens nuevo y **el refresh token anterior deja de servir** (rotación): guardá siempre el último.\n" +
            "4. Para cerrar sesión: `POST /auth/logout` con el `refreshToken`.\n\n" +
            "**Quién sos lo dice el token, nunca el body ni la URL.**\n\n" +
            "## ¿Qué viaja en cada parte de la request?\n" +
            "| Parte | Qué lleva | Ejemplo |\n|---|---|---|\n" +
            "| **Header** `Authorization` | La **identidad** (access token firmado por el servidor) | `Bearer eyJhbGciOi...` |\n" +
            "| **Path** | **Sobre qué recurso** se actúa | `/compras/{id}/cancelar` |\n" +
            "| **Query** | Filtros, orden y paginación (sólo lecturas) | `?ordenarPor=precio&page=2` |\n" +
            "| **Body** | Los **datos** de la acción (y el refresh token en `/auth/refresh` y `/auth/logout`) | `{ \"cantidad\": 2 }` |\n\n" +
            "## Autorización: roles y permisos\n" +
            "- **Público (sin token):** ver categorías, buscar y explorar eventos, ver el detalle de un evento y las reseñas de su organizador, registrarse, iniciar sesión, renovar y cerrar sesión.\n" +
            "- **`COMPRADOR`:** ver *mis* compras, comprar, pagar, cancelar, guardar favoritos y calificar eventos.\n" +
            "- **`ORGANIZADOR`:** crear eventos y ver las compras de *sus* eventos (con las entradas que quedan por tipo).\n" +
            "- **Ambos roles:** chatear dentro de una compra, ver su detalle y su historial (sólo quienes participan de *esa* compra), ver el propio perfil.\n" +
            "- **Además del rol, la pertenencia:** aunque tengas el rol correcto, sólo podés operar sobre lo tuyo (la compra es tuya; el evento es tuyo). Si no, **403**.\n\n" +
            "**Códigos:** `401` = no estás autenticado (falta el token, es inválido o venció). `403` = estás autenticado pero no tenés permiso " +
            "(rol equivocado o el recurso no es tuyo). `404` = el recurso no existe.\n\n" +
            "**Formato de éxito:** `{ status: \"success\", data, paginacion? }`. **Formato de error:** `{ status, message, timestamp, details? }`.\n\n" +
            "## Estados de una compra\n" +
            "`PENDIENTE → CONFIRMADA` (pago) y de ahí `REEMBOLSADA` (cancelada tras pagar). " +
            "Una compra `PENDIENTE` cancelada queda `CANCELADA`. **Al llegar la fecha del evento** el sistema cierra las compras solo: " +
            "las `CONFIRMADAS` pasan a `UTILIZADA` y las `PENDIENTES` (nunca pagadas) a `CANCELADA`."
    },
    servers: [{ url: "/api", description: "Servidor actual" }],
    tags: [
        { name: "Autenticación" }, { name: "Usuarios" }, { name: "Favoritos" }, { name: "Categorías" }, { name: "Eventos" },
        { name: "Compras" }, { name: "Chat" }, { name: "Reseñas" }, { name: "Sistema" }
    ],
    components: {
        securitySchemes: {
            BearerAuth: {
                type: "http", scheme: "bearer", bearerFormat: "JWT",
                description: "**Access token** obtenido en `POST /auth/login`, `POST /auth/registro` o `POST /auth/refresh` (campo `accessToken`). Se envía como `Authorization: Bearer <token>`."
            }
        },
        parameters: {
            IdPath: { name: "id", in: "path", required: true, schema: objectId() },
            EventoIdPath: { name: "eventoId", in: "path", required: true, schema: objectId("Id del evento") },
            Page: { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
            Limit: { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 10 } },
            EstadoQuery: { name: "estado", in: "query", description: "Filtra por estado de la compra", schema: ref("EstadoCompra") }
        },
        responses: {
            DatosInvalidos: { description: "400 - Datos de entrada inválidos", content: { "application/json": { schema: ref("Error") } } },
            NoIdentificado: { description: "401 - No autenticado: falta el token, es inválido o venció (o la cuenta ya no existe)", content: { "application/json": { schema: ref("Error") } } },
            Prohibido: { description: "403 - Estás autenticado pero no tenés permiso (rol insuficiente o el recurso no es tuyo)", content: { "application/json": { schema: ref("Error") } } },
            NoEncontrado: { description: "404 - Recurso no encontrado", content: { "application/json": { schema: ref("Error") } } },
            Conflicto: { description: "409 - Conflicto con el estado actual (cupo, estado de la compra, evento ya realizado, duplicado)", content: { "application/json": { schema: ref("Error") } } },
            ReglaDeNegocio: { description: "422 - La entidad no cumple una regla de negocio", content: { "application/json": { schema: ref("Error") } } }
        },
        schemas: {
            Error: {
                type: "object",
                properties: {
                    status: { type: "string", enum: ["fail", "error"] },
                    message: { type: "string", example: "Cupo insuficiente para \"General\": quedan 3 entradas disponibles" },
                    timestamp: fecha(),
                    details: { type: "array", description: "Sólo en errores de validación", items: { type: "object", properties: { en: { type: "string", example: "body" }, campo: { type: "string", example: "tiposEntrada.0.cupo" }, mensaje: { type: "string" } } } }
                }
            },
            Paginacion: {
                type: "object",
                properties: { numeroPagina: { type: "integer" }, limitePorPagina: { type: "integer" }, totalPaginas: { type: "integer" }, totalElementos: { type: "integer" } }
            },
            Usuario: { type: "object", properties: { id: objectId(), nombre: { type: "string", example: "Ana" }, apellido: { type: "string", example: "Pérez" } } },
            Rol: { type: "string", enum: ["COMPRADOR", "ORGANIZADOR"] },
            Perfil: {
                type: "object", description: "Datos de la propia cuenta (sólo los ve su dueño)",
                properties: { id: objectId(), nombre: { type: "string" }, apellido: { type: "string" }, email: { type: "string", format: "email" }, rol: ref("Rol") }
            },
            RegistroInput: {
                type: "object", required: ["nombre", "apellido", "email", "password", "rol"], additionalProperties: false,
                properties: {
                    nombre: { type: "string", maxLength: 60 }, apellido: { type: "string", maxLength: 60 },
                    email: { type: "string", format: "email", example: "ana@ejemplo.com" },
                    password: { type: "string", format: "password", minLength: 8, maxLength: 72 },
                    rol: { ...ref("Rol"), description: "Tipo de cuenta que se crea. Se elige acá y no se puede cambiar por la API." }
                }
            },
            LoginInput: {
                type: "object", required: ["email", "password"], additionalProperties: false,
                properties: { email: { type: "string", format: "email", example: "ana@ticketit.com" }, password: { type: "string", format: "password", example: "password123" } }
            },
            Sesion: {
                type: "object",
                properties: {
                    accessToken: { type: "string", description: "JWT de vida corta (15 min). Se envía en `Authorization: Bearer <accessToken>`", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                    tipo: { type: "string", example: "Bearer" },
                    expiraEnSegundos: { type: "integer", example: 900, description: "Cuánto dura el accessToken" },
                    refreshToken: { type: "string", description: "Texto aleatorio de vida larga (7 días). Sólo sirve para `POST /auth/refresh` y `POST /auth/logout`. Se descarta al usarlo: guardar siempre el último.", example: "k3J9x...Qw" },
                    usuario: ref("Perfil")
                }
            },
            RefreshInput: {
                type: "object", required: ["refreshToken"], additionalProperties: false,
                properties: { refreshToken: { type: "string", description: "El refreshToken recibido en el último login o refresh" } }
            },
            Categoria: { type: "object", properties: { id: objectId(), nombre: { type: "string", example: "Recitales" }, descripcion: { type: "string" } } },
            TipoEntrada: {
                type: "object",
                properties: {
                    id: objectId(), nombre: { type: "string", example: "VIP" }, descripcion: { type: "string" },
                    precio: { type: "number", example: 25000 }, cupo: { type: "integer", description: "Capacidad total" },
                    entradasVendidas: { type: "integer" }, entradasDisponibles: { type: "integer" }
                }
            },
            TipoEntradaInput: {
                type: "object", required: ["nombre", "precio", "cupo"], additionalProperties: false,
                properties: { nombre: { type: "string", maxLength: 60 }, descripcion: { type: "string", maxLength: 300 }, precio: { type: "number", minimum: 0 }, cupo: { type: "integer", minimum: 1 } }
            },
            Reputacion: {
                type: "object",
                description: "Promedio de las reseñas que recibió el organizador en todos sus eventos",
                properties: { promedio: { type: "number", nullable: true, example: 4.5, description: "null si todavía no tiene reseñas" }, cantidadResenias: { type: "integer" } }
            },
            Evento: {
                type: "object",
                properties: {
                    id: objectId(), nombre: { type: "string" }, descripcion: { type: "string" }, categoria: ref("Categoria"), fecha: fecha(),
                    multimedia: lista({ type: "string", format: "uri" }), organizador: ref("Usuario"), tiposEntrada: lista(ref("TipoEntrada")),
                    precioMinimo: { type: "number", description: "Sólo en el listado: precio más bajo entre sus tipos de entrada" },
                    organizadorReputacion: ref("Reputacion")
                }
            },
            CategoriaInput: {
                type: "object", required: ["nombre"], additionalProperties: false,
                description: "Categoría del evento. Si ya existe una con ese nombre (sin distinguir mayúsculas ni acentos) se reutiliza y la `descripcion` enviada se ignora; si no existe, se crea.",
                properties: { nombre: { type: "string", minLength: 3, maxLength: 60, example: "Recitales" }, descripcion: { type: "string", maxLength: 300, example: "Música en vivo" } }
            },
            EventoInput: {
                type: "object", required: ["nombre", "descripcion", "categoria", "fecha", "tiposEntrada"], additionalProperties: false,
                properties: {
                    nombre: { type: "string", minLength: 3, maxLength: 120 }, descripcion: { type: "string", maxLength: 5000 },
                    categoria: ref("CategoriaInput"),
                    fecha: { type: "string", format: "date-time", example: "2027-03-20T21:00:00-03:00", description: "ISO 8601 con zona horaria; debe ser futura" },
                    multimedia: lista({ type: "string", format: "uri" }),
                    tiposEntrada: { type: "array", minItems: 1, maxItems: 20, items: ref("TipoEntradaInput") }
                }
            },
            EstadoCompra: { type: "string", enum: ["PENDIENTE", "CONFIRMADA", "UTILIZADA", "CANCELADA", "REEMBOLSADA"] },
            Compra: {
                type: "object",
                properties: {
                    id: objectId(), estado: ref("EstadoCompra"),
                    diasParaEvento: { type: "integer", nullable: true, description: "Sólo si la compra está CONFIRMADA; en los demás estados es null" },
                    evento: { type: "object", properties: { id: objectId(), nombre: { type: "string" }, fecha: fecha() } },
                    comprador: ref("Usuario"),
                    tipoEntrada: { type: "object", properties: { id: objectId(), nombre: { type: "string" }, precioUnitario: { type: "number" } } },
                    cantidad: { type: "integer" }, total: { type: "number" }, cantidadMensajes: { type: "integer" }, creadaEn: fecha()
                }
            },
            CompraInput: {
                type: "object", required: ["eventoId", "tipoEntradaId", "cantidad"], additionalProperties: false,
                properties: { eventoId: objectId(), tipoEntradaId: objectId("Id del tipo de entrada (dentro de `tiposEntrada` del evento)"), cantidad: { type: "integer", minimum: 1 } }
            },
            Mensaje: { type: "object", properties: { id: objectId(), usuario: ref("Usuario"), mensaje: { type: "string" }, enviado: fecha() } },
            MensajeInput: { type: "object", required: ["mensaje"], additionalProperties: false, properties: { mensaje: { type: "string", minLength: 1, maxLength: 1000 } } },
            CambioEstadoCompra: {
                type: "object",
                properties: {
                    estado: ref("EstadoCompra"),
                    quien: { allOf: [ref("Usuario")], nullable: true, description: "null cuando lo hizo el sistema" },
                    realizadoPorElSistema: { type: "boolean" }, fechaHora: fecha()
                }
            },
            Resenia: {
                type: "object",
                properties: {
                    id: objectId(), puntuacion: { type: "number", minimum: 1, maximum: 5 }, detalle: { type: "string" }, comprador: ref("Usuario"),
                    evento: { type: "object", properties: { id: objectId(), nombre: { type: "string" }, fecha: fecha() } }, creadaEn: fecha()
                }
            },
            ReseniaInput: {
                type: "object", required: ["puntuacion", "detalle"], additionalProperties: false,
                properties: { puntuacion: { type: "number", minimum: 1, maximum: 5, example: 4.5 }, detalle: { type: "string", minLength: 1, maxLength: 1000 } }
            },
            ComprasDeEvento: {
                type: "object",
                properties: {
                    evento: { type: "object", properties: { id: objectId(), nombre: { type: "string" }, fecha: fecha() } },
                    entradasPorTipo: lista(ref("TipoEntrada")),
                    compras: lista(ref("Compra"))
                }
            },
            ReseniasDelOrganizador: {
                type: "object",
                properties: { organizador: ref("Usuario"), reputacion: ref("Reputacion"), resenias: lista(ref("Resenia")) }
            }
        }
    },
    paths: {
        "/health": {
            get: { tags: ["Sistema"], summary: "Estado del servidor", responses: { 200: exito("OK", { type: "object", properties: { ok: { type: "boolean" } } }) } }
        },

        // ---------- Autenticación ----------
        "/auth/registro": {
            post: {
                tags: ["Autenticación"], summary: "Crear una cuenta",
                description: "Público. Elegís el rol de la cuenta (`COMPRADOR` u `ORGANIZADOR`). La respuesta ya incluye los tokens (queda con la sesión iniciada). La contraseña se guarda hasheada (bcrypt): nunca en texto plano.",
                requestBody: cuerpo(ref("RegistroInput")),
                responses: { 201: exito("Cuenta creada y sesión iniciada", ref("Sesion")), ...errores(400, 409) }
            }
        },
        "/auth/login": {
            post: {
                tags: ["Autenticación"], summary: "Iniciar sesión",
                description: "Público. Si el email no existe o la contraseña es incorrecta se responde lo mismo (401), para no revelar qué emails están registrados.",
                requestBody: cuerpo(ref("LoginInput")),
                responses: { 200: exito("Sesión iniciada", ref("Sesion")), ...errores(400, 401) }
            }
        },
        "/auth/refresh": {
            post: {
                tags: ["Autenticación"], summary: "Renovar la sesión con el refresh token",
                description:
                    "Público: se usa justo cuando el access token venció, por eso no lleva `Authorization`; la credencial es el `refreshToken` del body.\n\n" +
                    "**Rotación:** cada refresh token sirve **una sola vez**. La respuesta trae un par nuevo (`accessToken` y `refreshToken`) y el anterior queda inválido.\n\n" +
                    "**Detección de robo:** si se presenta un refresh token que ya fue usado, se asume que fue copiado y se **cierra toda la sesión** " +
                    "(también el token más nuevo): hay que volver a iniciar sesión.",
                requestBody: cuerpo(ref("RefreshInput")),
                responses: { 200: exito("Sesión renovada", ref("Sesion")), ...errores(400, 401) }
            }
        },
        "/auth/logout": {
            post: {
                tags: ["Autenticación"], summary: "Cerrar sesión",
                description: "Público. Revoca la sesión completa (todos los refresh tokens que descienden del mismo login). Responde 204 aunque el token no exista (no revela si era válido). El access token ya emitido sigue valiendo hasta que venza (máx. 15 min): el cliente debe descartarlo.",
                requestBody: cuerpo(ref("RefreshInput")),
                responses: { 204: { description: "Sesión cerrada" }, ...errores(400) }
            }
        },
        "/auth/me": {
            get: {
                tags: ["Autenticación"], summary: "Mi perfil", security: conToken,
                description: "Devuelve la cuenta a la que pertenece el token. Sirve para comprobar que el token es válido.",
                responses: { 200: exito("Mi perfil", ref("Perfil")), ...errores(401) }
            }
        },

        // ---------- Usuarios ----------
        "/usuarios/{id}": {
            get: {
                tags: ["Usuarios"], summary: "Obtener los datos públicos de un usuario", security: conToken, parameters: [paramRef("IdPath")],
                responses: { 200: exito("Usuario", ref("Usuario")), ...errores(400, 401, 404) }
            }
        },

        // ---------- Favoritos ----------
        "/favoritos": {
            get: {
                tags: ["Favoritos"], summary: "Mis eventos favoritos (COMPRADOR)", security: conToken,
                responses: { 200: exito("Eventos favoritos", lista(ref("Evento"))), ...errores(401, 403) }
            }
        },
        "/favoritos/{eventoId}": {
            post: {
                tags: ["Favoritos"], summary: "Marcar un evento como favorito (COMPRADOR, idempotente)", security: conToken, parameters: [paramRef("EventoIdPath")],
                responses: { 200: exito("Evento agregado a favoritos", ref("Evento")), ...errores(400, 401, 403, 404) }
            },
            delete: {
                tags: ["Favoritos"], summary: "Quitar un evento de favoritos (COMPRADOR)", security: conToken, parameters: [paramRef("EventoIdPath")],
                responses: { 204: { description: "Quitado" }, ...errores(400, 401, 403) }
            }
        },

        // ---------- Categorías ----------
        "/categorias": {
            get: { tags: ["Categorías"], summary: "Listar categorías (para explorar eventos)", description: "Público.", responses: { 200: exito("Categorías", lista(ref("Categoria"))) } }
        },

        // ---------- Eventos ----------
        "/eventos": {
            get: {
                tags: ["Eventos"],
                summary: "Buscar y explorar eventos futuros",
                description:
                    "Busca por texto (`q`, en nombre y descripción), explora por categoría y filtra por rango de precio " +
                    "(el evento entra si **algún** tipo de entrada está en el rango). Ordena por `precio` (el más bajo de sus entradas), " +
                    "`fecha` o `puntaje` del organizador (los organizadores sin reseñas quedan al final).",
                parameters: [
                    { name: "q", in: "query", schema: { type: "string" }, description: "Texto a buscar en nombre y descripción" },
                    { name: "categoriaId", in: "query", description: "Id de una categoría (ver `GET /categorias`)", schema: objectId() },
                    { name: "organizadorId", in: "query", schema: objectId() },
                    { name: "precioMin", in: "query", schema: { type: "number", minimum: 0 } },
                    { name: "precioMax", in: "query", schema: { type: "number", minimum: 0 } },
                    { name: "ordenarPor", in: "query", schema: { type: "string", enum: ["precio", "fecha", "puntaje"], default: "fecha" } },
                    { name: "orden", in: "query", description: "Por defecto: asc para fecha y precio, desc para puntaje", schema: { type: "string", enum: ["asc", "desc"] } },
                    paramRef("Page"), paramRef("Limit")
                ],
                responses: { 200: exito("Eventos", lista(ref("Evento")), { paginado: true }), ...errores(400) }
            },
            post: {
                tags: ["Eventos"], summary: "Crear un evento con su categoría y sus tipos de entrada (precio y cupo)", security: conToken,
                description: "**Rol requerido: `ORGANIZADOR`** (403 para un comprador). El organizador es el usuario del token: no se envía en el body.\n\n**Categoría:** va como objeto `{ nombre, descripcion? }`. Si ya existe una con ese nombre (sin distinguir mayúsculas ni acentos) el evento la reutiliza; si no, se crea. Para ver las existentes: `GET /categorias`.",
                requestBody: cuerpo(ref("EventoInput")),
                responses: { 201: exito("Evento creado", ref("Evento")), ...errores(400, 401, 403, 404, 422) }
            }
        },
        "/eventos/{id}": {
            get: {
                tags: ["Eventos"], summary: "Detalle del evento con la reputación de su organizador", parameters: [paramRef("IdPath")],
                responses: { 200: exito("Evento", ref("Evento")), ...errores(400, 404) }
            }
        },
        "/eventos/{id}/compras": {
            get: {
                tags: ["Eventos"], summary: "Compras de un evento y entradas que quedan por tipo (organizador)", security: conToken,
                description: "**Rol requerido: `ORGANIZADOR`**, y además tiene que ser el organizador de **ese** evento (403 en cualquier otro caso).",
                parameters: [paramRef("IdPath"), paramRef("EstadoQuery")],
                responses: { 200: exito("Compras del evento", ref("ComprasDeEvento")), ...errores(400, 401, 403, 404) }
            }
        },
        "/eventos/{id}/resenias": {
            get: {
                tags: ["Reseñas"], summary: "Reseñas del organizador del evento (de todos sus eventos) y su reputación",
                parameters: [paramRef("IdPath"), paramRef("Page"), paramRef("Limit")],
                responses: { 200: exito("Reseñas", ref("ReseniasDelOrganizador"), { paginado: true }), ...errores(400, 404) }
            },
            post: {
                tags: ["Reseñas"], summary: "Puntuar y comentar un evento", security: conToken,
                description: "**Rol requerido: `COMPRADOR`**, con una entrada UTILIZADA en el evento. Una reseña por comprador y evento.",
                parameters: [paramRef("IdPath")], requestBody: cuerpo(ref("ReseniaInput")),
                responses: { 201: exito("Reseña creada", ref("Resenia")), ...errores(400, 401, 403, 404, 409) }
            }
        },

        // ---------- Compras ----------
        "/compras": {
            get: {
                tags: ["Compras"], summary: "Mis compras", security: conToken,
                description: "**Rol requerido: `COMPRADOR`.** Incluye el estado de cada compra y, si está CONFIRMADA, `diasParaEvento`.",
                parameters: [paramRef("EstadoQuery")],
                responses: { 200: exito("Mis compras", lista(ref("Compra"))), ...errores(400, 401, 403) }
            },
            post: {
                tags: ["Compras"], summary: "Comprar entradas de un tipo", security: conToken,
                description: "**Rol requerido: `COMPRADOR`.** El comprador es el usuario del token. Valida que el evento no se haya realizado y que alcance el cupo (se descuenta de forma atómica). La compra arranca PENDIENTE.",
                requestBody: cuerpo(ref("CompraInput")),
                responses: { 201: exito("Compra creada", ref("Compra")), ...errores(400, 401, 403, 404, 409) }
            }
        },
        "/compras/{id}": {
            get: {
                tags: ["Compras"], summary: "Detalle de una compra (comprador u organizador)", security: conToken,
                description: "**Ambos roles**, pero sólo el comprador o el organizador de **esa** compra.", parameters: [paramRef("IdPath")],
                responses: { 200: exito("Compra", ref("Compra")), ...errores(400, 401, 403, 404) }
            }
        },
        "/compras/{id}/confirmar-pago": {
            post: {
                tags: ["Compras"], summary: "Confirmar el pago: PENDIENTE → CONFIRMADA (comprador)", security: conToken,
                description: "**Autorización por pertenencia:** sólo el comprador de esa compra.", parameters: [paramRef("IdPath")],
                responses: { 200: exito("Compra confirmada", ref("Compra")), ...errores(400, 401, 403, 404, 409) }
            }
        },
        "/compras/{id}/cancelar": {
            post: {
                tags: ["Compras"], summary: "Cancelar la compra (comprador)", security: conToken, parameters: [paramRef("IdPath")],
                description:
                    "**Rol requerido: `COMPRADOR`**, y la compra tiene que ser tuya. " +
                    "PENDIENTE → CANCELADA; CONFIRMADA → REEMBOLSADA. No se puede si la entrada ya fue UTILIZADA o si el evento ya se realizó. " +
                    "Las entradas vuelven a quedar disponibles.",
                responses: { 200: exito("Compra cancelada", ref("Compra")), ...errores(400, 401, 403, 404, 409) }
            }
        },
        "/compras/{id}/historial": {
            get: {
                tags: ["Compras"], summary: "Seguimiento: cambios de estado de la compra", security: conToken,
                description: "**Ambos roles**, pero sólo el comprador o el organizador de **esa** compra.", parameters: [paramRef("IdPath")],
                responses: { 200: exito("Historial", lista(ref("CambioEstadoCompra"))), ...errores(400, 401, 403, 404) }
            }
        },

        // ---------- Chat ----------
        "/compras/{id}/mensajes": {
            get: {
                tags: ["Chat"], summary: "Mensajes de la compra, en orden cronológico", security: conToken,
                description: "**Ambos roles**, pero sólo el comprador o el organizador de **esa** compra.", parameters: [paramRef("IdPath")],
                responses: { 200: exito("Mensajes", lista(ref("Mensaje"))), ...errores(400, 401, 403, 404) }
            },
            post: {
                tags: ["Chat"], summary: "Enviar un mensaje (comprador u organizador, en cualquier estado)", security: conToken,
                description: "**Ambos roles**, pero sólo el comprador o el organizador de **esa** compra. El emisor es el usuario del token.",
                parameters: [paramRef("IdPath")], requestBody: cuerpo(ref("MensajeInput")),
                responses: { 201: exito("Mensaje enviado", ref("Mensaje")), ...errores(400, 401, 403, 404, 422) }
            }
        }
    }
}

export default spec
