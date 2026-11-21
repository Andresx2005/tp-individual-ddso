import * as SecureStore from "expo-secure-store"

// Los tokens van al almacén seguro del sistema (Keychain / Keystore), nunca a AsyncStorage.
const KEY = "aiticketit.session"

export async function cargarSesion() {
    try {
        const raw = await SecureStore.getItemAsync(KEY)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

export async function guardarSesion({ accessToken, refreshToken, usuario }) {
    try {
        await SecureStore.setItemAsync(KEY, JSON.stringify({ accessToken, refreshToken, usuario }))
    } catch { /* si falla, la sesión vive sólo en memoria */ }
}

export async function borrarSesion() {
    try { await SecureStore.deleteItemAsync(KEY) } catch { /* nada que hacer */ }
}
