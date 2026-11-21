import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
import { AppState, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useHeaderHeight } from "@react-navigation/elements"
import { useIsFocused } from "@react-navigation/native"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import { EmptyState, ErrorState, LoadingView } from "../../components/States"
import { enviarMensaje, listarMensajes } from "../../api/compras"
import { useAuth } from "../../context/AuthContext"
import { CHAT_POLL_MS } from "../../config"
import { colors, fonts, radius, spacing, TOUCH } from "../../theme"
import { formatMomento } from "../../utils/format"
import { mensajeDeError } from "../../utils/errors"

const MAX = 1000

export default function ChatScreen({ route, navigation }) {
    const { compraId, titulo, contraparte } = route.params
    const { user } = useAuth()
    const enfocada = useIsFocused()
    const altoHeader = useHeaderHeight()
    const listaRef = useRef(null)
    const [mensajes, setMensajes] = useState(null)
    const [error, setError] = useState(null)
    const [texto, setTexto] = useState("")
    const [enviando, setEnviando] = useState(false)
    const [errorEnvio, setErrorEnvio] = useState(null)

    useLayoutEffect(() => { navigation.setOptions({ title: titulo ? `Chat · ${titulo}` : "Chat" }) }, [navigation, titulo])

    const cargar = useCallback(async ({ silencioso = false } = {}) => {
        try {
            const data = await listarMensajes(compraId)
            setMensajes((previos) => (previos && previos.length === data.length && previos[previos.length - 1]?.id === data[data.length - 1]?.id ? previos : data))
            setError(null)
        } catch (e) {
            if (!silencioso) setError(e)
        }
    }, [compraId])

    useEffect(() => { cargar() }, [cargar])

    // El backend no tiene websockets: mientras el chat está a la vista y la app activa, se consulta cada pocos segundos.
    useEffect(() => {
        if (!enfocada) return
        const t = setInterval(() => { if (AppState.currentState === "active") cargar({ silencioso: true }) }, CHAT_POLL_MS)
        return () => clearInterval(t)
    }, [enfocada, cargar])

    async function enviar() {
        const mensaje = texto.trim()
        if (!mensaje || enviando) return
        setEnviando(true)
        setErrorEnvio(null)
        try {
            const nuevo = await enviarMensaje(compraId, mensaje)
            setMensajes((prev) => (prev?.some((m) => m.id === nuevo.id) ? prev : [...(prev ?? []), nuevo]))
            setTexto("") // sólo se limpia si salió bien: si falla, el mensaje no se pierde
        } catch (e) {
            setErrorEnvio(mensajeDeError(e))
        } finally {
            setEnviando(false)
        }
    }

    if (mensajes === null && !error) return <Screen><LoadingView mensaje="Cargando mensajes…" /></Screen>
    if (mensajes === null && error) return <Screen><ErrorState error={error} onReintentar={() => cargar()} /></Screen>

    return (
        <Screen edges={["left", "right", "bottom"]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={altoHeader}>
                <FlatList
                    ref={listaRef}
                    data={mensajes}
                    keyExtractor={(m) => String(m.id)}
                    contentContainerStyle={styles.lista}
                    onContentSizeChange={() => listaRef.current?.scrollToEnd({ animated: true })}
                    ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
                    ListEmptyComponent={
                        <EmptyState icon="chatbubbles-outline" titulo="Todavía no hay mensajes" mensaje={`Escribile a ${contraparte ?? "la otra parte"} para consultar sobre el evento, el acceso al lugar o cambios de fecha.`} />
                    }
                    renderItem={({ item }) => {
                        const mio = item.usuario?.id === user?.id
                        return (
                            <View
                                style={[styles.fila, mio ? styles.filaMia : styles.filaOtra]}
                                accessible
                                accessibilityLabel={`${mio ? "Vos" : item.usuario?.nombre}, ${formatMomento(item.enviado)}: ${item.mensaje}`}
                            >
                                <View style={[styles.burbuja, mio ? styles.mia : styles.otra]}>
                                    {!mio && <Text variant="label" color={colors.primaryDark}>{item.usuario?.nombre} {item.usuario?.apellido}</Text>}
                                    <Text color={mio ? colors.onPrimary : colors.text}>{item.mensaje}</Text>
                                    <Text variant="caption" color={mio ? colors.onPrimary : colors.textMuted} style={styles.hora}>{formatMomento(item.enviado)}</Text>
                                </View>
                            </View>
                        )
                    }}
                />

                {errorEnvio ? (
                    <View style={styles.errorEnvio} accessibilityLiveRegion="assertive">
                        <Ionicons name="alert-circle" size={18} color={colors.danger} />
                        <Text variant="caption" color={colors.danger} style={{ flex: 1 }}>{errorEnvio} Tu mensaje sigue en el cuadro: probá enviarlo de nuevo.</Text>
                    </View>
                ) : null}

                <View style={styles.compositor}>
                    <View style={{ flex: 1 }}>
                        <TextInput
                            value={texto}
                            onChangeText={setTexto}
                            placeholder="Escribí un mensaje"
                            placeholderTextColor={colors.textMuted}
                            accessibilityLabel="Mensaje"
                            multiline
                            maxLength={MAX}
                            maxFontSizeMultiplier={1.6}
                            style={styles.input}
                        />
                        {texto.length > MAX - 100 && <Text variant="caption" color={colors.textMuted} style={styles.contador}>{texto.length}/{MAX}</Text>}
                    </View>
                    <Pressable
                        onPress={enviar}
                        disabled={!texto.trim() || enviando}
                        accessibilityRole="button"
                        accessibilityLabel="Enviar mensaje"
                        accessibilityState={{ disabled: !texto.trim() || enviando, busy: enviando }}
                        style={[styles.enviar, (!texto.trim() || enviando) && { opacity: 0.45 }]}
                    >
                        <Ionicons name="send" size={22} color={colors.onPrimary} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </Screen>
    )
}

const styles = StyleSheet.create({
    lista: { padding: spacing.lg, flexGrow: 1 },
    fila: { flexDirection: "row" },
    filaMia: { justifyContent: "flex-end" },
    filaOtra: { justifyContent: "flex-start" },
    burbuja: { maxWidth: "82%", paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, gap: 2 },
    mia: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
    otra: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
    hora: { alignSelf: "flex-end", opacity: 0.9 },
    compositor: { flexDirection: "row", alignItems: "flex-end", gap: spacing.sm, padding: spacing.md, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    input: { fontFamily: fonts.regular, fontSize: 16, color: colors.text, backgroundColor: colors.bg, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.borderStrong, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, minHeight: TOUCH, maxHeight: 120 },
    contador: { position: "absolute", right: spacing.md, bottom: 2 },
    enviar: { width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    errorEnvio: { flexDirection: "row", gap: spacing.xs, alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.dangerTint }
})
