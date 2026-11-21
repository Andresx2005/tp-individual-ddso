import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import * as authApi from "../api/auth"
import { getTokens, setSessionHandlers, setTokens } from "../api/client"
import { borrarSesion, cargarSesion, guardarSesion } from "../storage/session"
import { useToast } from "../components/Toast"

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
    const { mostrar } = useToast()
    const [estado, setEstado] = useState({ status: "loading", user: null }) // loading | in | out

    const cerrarLocal = useCallback(async () => {
        setTokens(null)
        await borrarSesion()
        setEstado({ status: "out", user: null })
    }, [])

    // Se llama al iniciar sesión, registrarse o cuando el cliente renueva los tokens por su cuenta.
    const abrirSesion = useCallback(async (sesion) => {
        setTokens({ accessToken: sesion.accessToken, refreshToken: sesion.refreshToken })
        await guardarSesion(sesion)
        setEstado((e) => ({ status: "in", user: sesion.usuario ?? e.user }))
    }, [])

    // Usuario vigente, para persistirlo cuando la respuesta del refresh no lo trae.
    const ultimoUsuario = useRef(null)
    ultimoUsuario.current = estado.user

    useEffect(() => {
        setSessionHandlers({
            onTokens: async (sesion) => { await guardarSesion({ ...sesion, usuario: sesion.usuario ?? ultimoUsuario.current }) },
            onExpired: async () => {
                await cerrarLocal()
                mostrar("Tu sesión venció. Volvé a iniciar sesión.", { tipo: "error" })
            }
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        async function iniciar() {
            const guardada = await cargarSesion()
            if (!guardada) return setEstado({ status: "out", user: null })
            setTokens({ accessToken: guardada.accessToken, refreshToken: guardada.refreshToken })
            setEstado({ status: "in", user: guardada.usuario })
            try {
                // Valida el token (si venció, el cliente lo renueva solo). Si no hay red, seguimos con lo guardado.
                const perfil = await authApi.miPerfil()
                setEstado({ status: "in", user: perfil })
            } catch { /* 401 -> onExpired ya cerró la sesión; error de red -> conservamos la sesión */ }
        }
        iniciar()
    }, [])

    const login = useCallback(async (email, password) => abrirSesion(await authApi.login(email, password)), [abrirSesion])
    const registro = useCallback(async (datos) => abrirSesion(await authApi.registro(datos)), [abrirSesion])
    const logout = useCallback(async () => {
        const refreshToken = getTokens()?.refreshToken
        if (refreshToken) { try { await authApi.cerrarSesion(refreshToken) } catch { /* se cierra igual en el dispositivo */ } }
        await cerrarLocal()
    }, [cerrarLocal])

    const value = useMemo(() => ({
        status: estado.status,
        user: estado.user,
        esComprador: estado.user?.rol === "COMPRADOR",
        esOrganizador: estado.user?.rol === "ORGANIZADOR",
        login, registro, logout
    }), [estado, login, registro, logout])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
