import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { agregarFavorito, listarFavoritos, quitarFavorito } from "../api/favoritos"
import { useAuth } from "./AuthContext"
import { useToast } from "../components/Toast"
import { mensajeDeError } from "../utils/errors"

// Mantiene el set de ids favoritos para pintar el corazón en cualquier lista sin pedir nada extra.
const FavoritosContext = createContext(null)
export const useFavoritos = () => useContext(FavoritosContext)

export function FavoritosProvider({ children }) {
    const { esComprador, user } = useAuth()
    const { mostrar } = useToast()
    const [ids, setIds] = useState(() => new Set())

    useEffect(() => {
        let activo = true
        if (!esComprador) { setIds(new Set()); return }
        listarFavoritos()
            .then((lista) => { if (activo) setIds(new Set(lista.map((e) => e.id))) })
            .catch(() => { /* el corazón se verá vacío; la pantalla Favoritos muestra su propio error */ })
        return () => { activo = false }
    }, [esComprador, user?.id])

    const esFavorito = useCallback((id) => ids.has(id), [ids])

    // Actualización optimista: el corazón cambia al instante y se revierte si el servidor falla.
    // Devuelve el nuevo estado (true = quedó como favorito) o null si falló.
    const alternar = useCallback(async (id) => {
        const eraFavorito = ids.has(id)
        const aplicar = (agregar) => setIds((prev) => { const n = new Set(prev); agregar ? n.add(id) : n.delete(id); return n })
        aplicar(!eraFavorito)
        try {
            if (eraFavorito) await quitarFavorito(id)
            else await agregarFavorito(id)
            return !eraFavorito
        } catch (error) {
            aplicar(eraFavorito)
            mostrar(mensajeDeError(error), { tipo: "error" })
            return null
        }
    }, [ids, mostrar])

    const value = useMemo(() => ({ esFavorito, alternar }), [esFavorito, alternar])
    return <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>
}
