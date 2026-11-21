import { useCallback, useEffect, useRef, useState } from "react"

// Lista paginada con scroll infinito. fetchPage(page) debe devolver { items, paginacion?, meta? }.
// Modos: initial (al cambiar filtros), refresh (pull-to-refresh), silent (al volver a la pantalla), more (siguiente página).
export default function usePaginated(fetchPage, deps = []) {
    const [s, setS] = useState({
        items: [], meta: null, page: 0, totalPaginas: 1, total: 0,
        loading: true, refreshing: false, loadingMore: false, error: null, moreError: null
    })
    const sRef = useRef(s)
    sRef.current = s
    const fetchRef = useRef(fetchPage)
    fetchRef.current = fetchPage
    const secuencia = useRef(0)

    const cargar = useCallback(async (modo) => {
        const actual = sRef.current
        if (modo === "more" && (actual.loadingMore || actual.loading || actual.page >= actual.totalPaginas)) return
        const id = modo === "more" ? secuencia.current : ++secuencia.current
        const page = modo === "more" ? actual.page + 1 : 1

        if (modo !== "silent") {
            setS((p) => ({
                ...p,
                items: modo === "initial" ? [] : p.items,
                loading: modo === "initial", refreshing: modo === "refresh", loadingMore: modo === "more",
                error: modo === "more" ? p.error : null, moreError: null
            }))
        }
        try {
            const res = await fetchRef.current(page)
            if (id !== secuencia.current) return
            setS((p) => {
                const previos = modo === "more" ? p.items : []
                const vistos = new Set(previos.map((i) => i.id))
                const nuevos = res.items.filter((i) => !vistos.has(i.id))
                return {
                    ...p,
                    items: [...previos, ...nuevos],
                    meta: modo === "more" ? p.meta : res.meta ?? p.meta,
                    page, totalPaginas: res.paginacion?.totalPaginas ?? 1,
                    total: res.paginacion?.totalElementos ?? previos.length + nuevos.length,
                    loading: false, refreshing: false, loadingMore: false, error: null, moreError: null
                }
            })
        } catch (error) {
            if (id !== secuencia.current) return
            setS((p) => ({
                ...p, loading: false, refreshing: false, loadingMore: false,
                error: modo === "more" || modo === "silent" ? p.error : error,
                moreError: modo === "more" ? error : null
            }))
        }
    }, [])

    useEffect(() => {
        cargar("initial")
        return () => { secuencia.current++ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps)

    return {
        ...s,
        reload: useCallback(() => cargar("initial"), [cargar]),
        refresh: useCallback(() => cargar("refresh"), [cargar]),
        silent: useCallback(() => cargar("silent"), [cargar]),
        loadMore: useCallback(() => cargar("more"), [cargar])
    }
}
