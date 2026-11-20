// Roles del sistema, tomados de los casos de uso de la consigna:
//  COMPRADOR   -> busca y explora eventos, guarda favoritos, compra, cancela, chatea y califica.
//  ORGANIZADOR -> crea eventos con sus tipos de entrada, ve las compras de sus eventos y chatea con los compradores.
// Cada cuenta tiene UN rol, que se elige al registrarse. El rol dice QUÉ TIPO de acciones puede hacer; que una acción
// concreta (cancelar ESTA compra, ver las compras de ESTE evento) le corresponda lo decide el dominio según el recurso.
export const Rol = Object.freeze({
    COMPRADOR: "COMPRADOR",
    ORGANIZADOR: "ORGANIZADOR"
})
