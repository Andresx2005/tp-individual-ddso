import { normalizarTexto } from "../utils/texto.js"

export class CategoriaRepository {
    constructor() {
        this.categorias = new Map() // id -> Categoria
        this.nextId = 1
    }

    listar() {
        return [...this.categorias.values()].sort((a, b) => normalizarTexto(a.nombre).localeCompare(normalizarTexto(b.nombre), "es"))
    }

    buscarPorId(id) {
        return this.categorias.get(String(id)) ?? null
    }

    // Dos nombres son "el mismo" si sólo difieren en mayúsculas, acentos o espacios repetidos
    // (evita duplicados como "Recitales", "recitales" y "RECITALES").
    buscarPorNombre(nombre) {
        const buscado = normalizarTexto(nombre)
        return [...this.categorias.values()].find((c) => normalizarTexto(c.nombre) === buscado) ?? null
    }

    // Devuelve la categoría existente con ese nombre o registra la nueva.
    // Buscar y guardar ocurren de corrido, así que nunca se generan dos categorías con el mismo nombre.
    obtenerOCrear(categoria) {
        const existente = this.buscarPorNombre(categoria.nombre)
        if (existente) return existente
        categoria.id = this.nextId++
        this.categorias.set(String(categoria.id), categoria)
        return categoria
    }
}
