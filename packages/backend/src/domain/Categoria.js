export class Categoria {
    id
    nombre
    descripcion

    constructor({ id = null, nombre, descripcion = "" }) {
        this.id = id
        this.nombre = nombre
        this.descripcion = descripcion
    }
}
