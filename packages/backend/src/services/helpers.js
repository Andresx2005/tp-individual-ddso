// DTO de paginación, común a todos los listados paginados.
export const paginacionToDTO = ({ pagina, limite, total }) => ({
    numeroPagina: pagina,
    limitePorPagina: limite,
    totalPaginas: total === 0 ? 0 : Math.ceil(total / limite),
    totalElementos: total
})
