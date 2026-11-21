import { useEffect, useState } from "react"

export default function useDebounce(valor, ms = 400) {
    const [debounced, setDebounced] = useState(valor)
    useEffect(() => {
        const t = setTimeout(() => setDebounced(valor), ms)
        return () => clearTimeout(t)
    }, [valor, ms])
    return debounced
}
