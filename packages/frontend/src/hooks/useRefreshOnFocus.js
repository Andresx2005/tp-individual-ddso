import { useCallback, useRef } from "react"
import { useFocusEffect } from "@react-navigation/native"

// Vuelve a pedir los datos (sin spinner) cuando la pantalla recupera el foco, p. ej. al volver de un chat
// o de pagar una compra. Se omite la primera vez porque la carga inicial ya la hace el hook de datos.
export default function useRefreshOnFocus(fn) {
    const primera = useRef(true)
    const fnRef = useRef(fn)
    fnRef.current = fn
    useFocusEffect(useCallback(() => {
        if (primera.current) { primera.current = false; return }
        fnRef.current()
    }, []))
}
