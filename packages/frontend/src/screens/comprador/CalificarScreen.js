import React, { useState } from "react"
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native"
import { useHeaderHeight } from "@react-navigation/elements"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import Button from "../../components/Button"
import TextField from "../../components/TextField"
import { Banner } from "../../components/States"
import { PuntajeInput } from "../../components/Puntaje"
import { useToast } from "../../components/Toast"
import { crearResenia } from "../../api/eventos"
import { colors, spacing } from "../../theme"
import { erroresPorCampo, mensajeDeError } from "../../utils/errors"

// Sólo se llega acá desde una compra UTILIZADA. El servidor valida igual (403/409) por si cambió algo.
export default function CalificarScreen({ route, navigation }) {
    const { eventoId, eventoNombre } = route.params
    const altoHeader = useHeaderHeight()
    const { mostrar } = useToast()
    const [puntuacion, setPuntuacion] = useState(0)
    const [detalle, setDetalle] = useState("")
    const [errores, setErrores] = useState({})
    const [errorGeneral, setErrorGeneral] = useState(null)
    const [enviando, setEnviando] = useState(false)

    async function enviar() {
        const e = {}
        if (!puntuacion) e.puntuacion = "Elegí un puntaje de 1 a 5"
        if (!detalle.trim()) e.detalle = "Escribí un comentario sobre tu experiencia"
        setErrores(e)
        setErrorGeneral(null)
        if (Object.keys(e).length) return
        setEnviando(true)
        try {
            await crearResenia(eventoId, { puntuacion, detalle: detalle.trim() })
            mostrar("¡Gracias! Tu reseña ya está publicada.")
            navigation.goBack()
        } catch (error) {
            setErrores(erroresPorCampo(error))
            setErrorGeneral(error.status === 409 ? "Ya calificaste este evento. Sólo se permite una reseña por evento." : mensajeDeError(error))
            setEnviando(false)
        }
    }

    return (
        <Screen>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={altoHeader}>
                <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Text variant="title" header>¿Cómo estuvo?</Text>
                    <Text color={colors.textMuted}>{eventoNombre}</Text>
                    <Text variant="caption" color={colors.textMuted}>Tu reseña la van a ver otros compradores en los eventos de este organizador.</Text>

                    <Banner mensaje={errorGeneral} />

                    <View style={styles.puntaje}>
                        <Text variant="subtitle" header>Tu puntaje</Text>
                        <PuntajeInput valor={puntuacion} onChange={setPuntuacion} />
                        {errores.puntuacion ? <Text color={colors.danger} accessibilityLiveRegion="polite">{errores.puntuacion}</Text> : null}
                    </View>

                    <TextField
                        label="Tu comentario" value={detalle} onChangeText={setDetalle} error={errores.detalle}
                        multiline maxLength={1000} showCounter hint="Contá qué te gustó y qué mejorarías."
                    />
                    <Button title="Publicar reseña" icon="send" onPress={enviar} loading={enviando} />
                </ScrollView>
            </KeyboardAvoidingView>
        </Screen>
    )
}

const styles = StyleSheet.create({
    scroll: { padding: spacing.xl, gap: spacing.lg },
    puntaje: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.md }
})
