import { useCallback, useEffect, useRef, useState } from "react"

// Carga un recurso y expone { data, loading, error, reload, setData }.
// Descarta respuestas viejas si cambian las dependencias o se desmonta la pantalla.
export default function useRequest(fn, deps = [], { enabled = true } = {}) {
    const [state, setState] = useState({ data: null, loading: enabled, error: null })
    const secuencia = useRef(0)
    const fnRef = useRef(fn)
    fnRef.current = fn

    const ejecutar = useCallback(async ({ silent = false } = {}) => {
        const id = ++secuencia.current
        if (!silent) setState((s) => ({ ...s, loading: true, error: null }))
        try {
            const data = await fnRef.current()
            if (id === secuencia.current) setState({ data, loading: false, error: null })
        } catch (error) {
            if (id === secuencia.current) setState((s) => ({ ...s, loading: false, error }))
        }
    }, [])

    useEffect(() => {
        if (enabled) ejecutar()
        return () => { secuencia.current++ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, ...deps])

    const setData = useCallback((actualizar) => {
        setState((s) => ({ ...s, data: typeof actualizar === "function" ? actualizar(s.data) : actualizar }))
    }, [])

    return { ...state, reload: ejecutar, setData }
}
