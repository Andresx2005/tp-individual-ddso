import React, { useRef, useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Text from "../../components/Text"
import Button from "../../components/Button"
import TextField from "../../components/TextField"
import { Banner } from "../../components/States"
import { useAuth } from "../../context/AuthContext"
import { colors, radius, spacing } from "../../theme"
import { mensajeDeError } from "../../utils/errors"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginScreen({ navigation }) {
    const insets = useSafeAreaInsets()
    const { login } = useAuth()
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [errores, setErrores] = useState({})
    const [errorGeneral, setErrorGeneral] = useState(null)
    const [cargando, setCargando] = useState(false)
    const passRef = useRef(null)

    async function enviar() {
        const e = {}
        if (!EMAIL_RE.test(email.trim())) e.email = "Ingresá un email válido, por ejemplo ana@ejemplo.com"
        if (!password) e.password = "Ingresá tu contraseña"
        setErrores(e)
        setErrorGeneral(null)
        if (Object.keys(e).length) return
        setCargando(true)
        try {
            await login(email.trim().toLowerCase(), password)
        } catch (error) {
            setErrorGeneral(error.status === 401 ? "El email o la contraseña no son correctos." : mensajeDeError(error))
            setCargando(false)
        }
    }

    return (
        <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}>
                    <View style={styles.logo} accessible={false}>
                        <Ionicons name="ticket" size={40} color={colors.primary} />
                    </View>
                    <Text variant="display" color={colors.onPrimary} header>AI Ticket It</Text>
                    <Text color={colors.onPrimary} style={styles.tagline}>Descubrí eventos y conseguí tus entradas desde el celular.</Text>
                </View>

                <View style={styles.form}>
                    <Text variant="title" header>Iniciá sesión</Text>
                    <Banner mensaje={errorGeneral} />
                    <TextField
                        label="Email" value={email} onChangeText={setEmail} error={errores.email}
                        keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress"
                        returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()}
                    />
                    <TextField
                        label="Contraseña" value={password} onChangeText={setPassword} error={errores.password} secure
                        inputRef={passRef} autoCapitalize="none" autoComplete="password" textContentType="password"
                        returnKeyType="go" onSubmitEditing={enviar}
                    />
                    <Button title="Iniciar sesión" onPress={enviar} loading={cargando} />
                    <View style={styles.registro}>
                        <Text color={colors.textMuted}>¿Todavía no tenés cuenta?</Text>
                        <Button title="Crear una cuenta" variant="secondary" onPress={() => navigation.navigate("Registro")} />
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1 },
    hero: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl + spacing.lg, gap: spacing.sm, borderBottomLeftRadius: radius.lg + 8, borderBottomRightRadius: radius.lg + 8 },
    logo: { width: 68, height: 68, borderRadius: radius.lg, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center", marginBottom: spacing.sm },
    tagline: { opacity: 0.95 },
    form: { padding: spacing.xl, gap: spacing.lg },
    registro: { gap: spacing.sm, marginTop: spacing.lg, alignItems: "stretch" }
})
