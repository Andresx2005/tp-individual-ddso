// Las categorías no se administran con endpoints propios: se crean al publicar un evento (ver EventoService.crear)
// y arrancan con un catálogo base. Esta API sólo permite consultarlas para explorar eventos.
export class CategoriaService {
    constructor({ categoriaRepository }) {
        this.categoriaRepository = categoriaRepository
    }

    static toDTO(categoria) {
        return { id: categoria.id, nombre: categoria.nombre, descripcion: categoria.descripcion }
    }

    // ---------- para los controllers (DTOs) ----------

    listar() {
        return this.categoriaRepository.listar().map((c) => CategoriaService.toDTO(c))
    }

    // ---------- para otros services (objetos de dominio) ----------

    // Devuelve la categoría existente con ese nombre (sin distinguir mayúsculas ni acentos) o registra la nueva.
    obtenerOCrear(categoria) {
        return this.categoriaRepository.obtenerOCrear(categoria)
    }
}
