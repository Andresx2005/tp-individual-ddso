// Normaliza un texto para compararlo sin que importen mayúsculas, acentos ni espacios repetidos:
// "  Música  EN vivo " y "musica en vivo" son el mismo texto.
export const normalizarTexto = (texto) =>
    String(texto)
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ")
