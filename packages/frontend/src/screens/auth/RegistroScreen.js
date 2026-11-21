import React, { useRef, useState } from "react"
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "../../components/Text"
import Button from "../../components/Button"
import TextField from "../../components/TextField"
import { Banner } from "../../components/States"
import Screen from "../../components/Screen"
import { useAuth } from "../../context/AuthContext"
import { colors, radius, spacing, TOUCH } from "../../theme"
import { erroresPorCampo, mensajeDeError } from "../../utils/errors"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ROLES = [
    { id: "COMPRADOR", icon: "ticket-outline", titulo: "Quiero comprar entradas", detalle: "Explorá eventos, guardá favoritos y comprá." },
    { id: "ORGANIZADOR", icon: "megaphone-outline", titulo: "Quiero organizar eventos", detalle: "Publicá eventos y seguí tus ventas." }
]

export default function RegistroScreen() {
    const { registro } = useAuth()
    const [rol, setRol] = useState("COMPRADOR")
    const [datos, setDatos] = useState({ nombre: "", apellido: "", email: "", password: "" })
    const [errores, setErrores] = useState({})
    const [errorGeneral, setErrorGeneral] = useState(null)
    const [cargando, setCargando] = useState(false)
    const apellidoRef = useRef(null)
    const emailRef = useRef(null)
    const passRef = useRef(null)
    const set = (campo) => (valor) => setDatos((d) => ({ ...d, [campo]: valor }))

    function validar() {
        const e = {}
        if (!datos.nombre.trim()) e.nombre = "Ingresá tu nombre"
        if (!datos.apellido.trim()) e.apellido = "Ingresá tu apellido"
        if (!EMAIL_RE.test(datos.email.trim())) e.email = "Ingresá un email válido, por ejemplo ana@ejemplo.com"
        if (datos.password.length < 8) e.password = "La contraseña debe tener al menos 8 caracteres"
        return e
    }

    async function enviar() {
        const e = validar()
        setErrores(e)
        setErrorGeneral(null)
        if (Object.keys(e).length) return
        setCargando(true)
        try {
            await registro({
                nombre: datos.nombre.trim(), apellido: datos.apellido.trim(),
                email: datos.email.trim().toLowerCase(), password: datos.password, rol
            })
        } catch (error) {
            // El backend devuelve 400 con detalles por campo y 409 si el email ya existe.
            const porCampo = erroresPorCampo(error)
            if (Object.keys(porCampo).length) setErrores(porCampo)
            setErrorGeneral(error.status === 409 ? "Ya existe una cuenta con ese email. Probá iniciar sesión." : mensajeDeError(error))
            setCargando(false)
        }
    }

    return (
        <Screen edges={["left", "right", "bottom"]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Text variant="subtitle" header>¿Cómo vas a usar la app?</Text>
                    <View style={styles.roles} accessibilityRole="radiogroup">
                        {ROLES.map((r) => {
                            const activo = rol === r.id
                            return (
                                <Pressable
                                    key={r.id}
                                    onPress={() => setRol(r.id)}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: activo }}
                                    accessibilityLabel={`${r.titulo}. ${r.detalle}`}
                                    style={[styles.rol, activo && styles.rolActivo]}
                                >
                                    <Ionicons name={r.icon} size={28} color={activo ? colors.primary : colors.textMuted} />
                                    <View style={{ flex: 1 }}>
                                        <Text variant="bodyBold">{r.titulo}</Text>
                                        <Text variant="caption" color={colors.textMuted}>{r.detalle}</Text>
                                    </View>
                                    <Ionicons name={activo ? "radio-button-on" : "radio-button-off"} size={24} color={activo ? colors.primary : colors.borderStrong} />
                                </Pressable>
                            )
                        })}
                    </View>
                    <Text variant="caption" color={colors.textMuted}>El tipo de cuenta no se puede cambiar después.</Text>

                    <Banner mensaje={errorGeneral} />
                    <TextField label="Nombre" value={datos.nombre} onChangeText={set("nombre")} error={errores.nombre} maxLength={60} autoComplete="given-name" returnKeyType="next" onSubmitEditing={() => apellidoRef.current?.focus()} />
                    <TextField label="Apellido" value={datos.apellido} onChangeText={set("apellido")} error={errores.apellido} maxLength={60} inputRef={apellidoRef} autoComplete="family-name" returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
                    <TextField label="Email" value={datos.email} onChangeText={set("email")} error={errores.email} inputRef={emailRef} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()} />
                    <TextField label="Contraseña" hint="Mínimo 8 caracteres" value={datos.password} onChangeText={set("password")} error={errores.password} secure maxLength={72} inputRef={passRef} autoCapitalize="none" returnKeyType="go" onSubmitEditing={enviar} />
                    <Button title="Crear cuenta" onPress={enviar} loading={cargando} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    )
}

const styles = StyleSheet.create({
    scroll: { padding: spacing.xl, gap: spacing.lg },
    roles: { gap: spacing.md },
    rol: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: TOUCH + 24, padding: spacing.lg, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
    rolActivo: { borderColor: colors.primary, backgroundColor: colors.primaryTint }
})
