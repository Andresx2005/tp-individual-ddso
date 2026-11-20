import { Categoria } from "../domain/Categoria.js"

// Catálogo inicial de categorías (los tipos de evento que menciona la consigna). Se carga siempre al arrancar,
// así hay con qué explorar aunque todavía nadie haya publicado un evento. Los organizadores pueden usar una de
// estas o introducir una nueva al crear su evento (ver EventoService.crear).
export const CATEGORIAS_BASE = [
    { nombre: "Recitales", descripcion: "Música en vivo" },
    { nombre: "Obras de teatro", descripcion: "Teatro y espectáculos escénicos" },
    { nombre: "Festivales", descripcion: "Festivales de uno o varios días" },
    { nombre: "Conferencias", descripcion: "Charlas, congresos y talleres" },
    { nombre: "Eventos deportivos", descripcion: "Partidos, carreras y competencias" }
]

export function cargarCategoriasBase({ categoriaRepository }) {
    for (const datos of CATEGORIAS_BASE) {
        categoriaRepository.obtenerOCrear(new Categoria(datos))
    }
}
