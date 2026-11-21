import React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import { colors, radius, spacing, TOUCH } from "../theme"
import { formatPuntaje, plural } from "../utils/format"

const icono = (valor, n) => (valor >= n ? "star" : valor >= n - 0.5 ? "star-half" : "star-outline")

// Reputación del organizador: ★ 4,5 (12 reseñas) o "Sin reseñas todavía".
export function Reputacion({ reputacion, compacto = false }) {
    const sin = !reputacion || reputacion.promedio === null || reputacion.promedio === undefined
    const cantidad = reputacion?.cantidadResenias ?? 0
    const texto = sin ? "Sin reseñas todavía" : `${formatPuntaje(reputacion.promedio)} · ${plural(cantidad, "reseña", "reseñas")}`
    return (
        <View
            style={styles.reputacion}
            accessible
            accessibilityLabel={sin ? "Organizador sin reseñas todavía" : `Puntaje del organizador ${formatPuntaje(reputacion.promedio)} de 5, ${plural(cantidad, "reseña", "reseñas")}`}
        >
            <Ionicons name={sin ? "star-outline" : "star"} size={compacto ? 16 : 18} color={sin ? colors.textMuted : "#8A5A00"} />
            <Text variant={compacto ? "caption" : "body"} color={colors.textMuted}>{texto}</Text>
        </View>
    )
}

// Estrellas de sólo lectura (para una reseña).
export function Estrellas({ valor }) {
    return (
        <View style={styles.estrellas} accessible accessibilityLabel={`${formatPuntaje(valor)} de 5`}>
            {[1, 2, 3, 4, 5].map((n) => <Ionicons key={n} name={icono(valor, n)} size={18} color="#8A5A00" />)}
            <Text variant="label" color={colors.text}> {formatPuntaje(valor)}</Text>
        </View>
    )
}

// Entrada de puntaje 1–5 con medios puntos (el backend acepta decimales: ej. 4,5).
// Tocar una estrella fija el valor entero; − y + ajustan de a 0,5. Funciona también con lector de pantalla (ajustable).
export function PuntajeInput({ valor, onChange }) {
    const menos = () => onChange(Math.max(1, (valor || 1.5) - 0.5))
    const mas = () => onChange(Math.min(5, (valor || 0.5) + 0.5))
    return (
        <View style={styles.input}>
            <View
                style={styles.estrellasInput}
                accessible
                accessibilityRole="adjustable"
                accessibilityLabel="Puntuación"
                accessibilityValue={{ text: valor ? `${formatPuntaje(valor)} de 5` : "sin elegir" }}
                accessibilityHint="Deslizá hacia arriba o abajo para cambiar el puntaje"
                accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
                onAccessibilityAction={(e) => (e.nativeEvent.actionName === "increment" ? mas() : menos())}
            >
                {[1, 2, 3, 4, 5].map((n) => (
                    <Pressable key={n} onPress={() => onChange(n)} style={styles.estrellaBtn} importantForAccessibility="no">
                        <Ionicons name={icono(valor, n)} size={38} color="#8A5A00" />
                    </Pressable>
                ))}
            </View>
            <View style={styles.ajuste}>
                <Pressable onPress={menos} disabled={valor <= 1} style={[styles.mini, valor <= 1 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="Bajar medio punto">
                    <Ionicons name="remove" size={24} color={colors.primary} />
                </Pressable>
                <Text variant="title" style={styles.numero}>{valor ? formatPuntaje(valor) : "–"}</Text>
                <Pressable onPress={mas} disabled={valor >= 5} style={[styles.mini, valor >= 5 && { opacity: 0.35 }]} accessibilityRole="button" accessibilityLabel="Subir medio punto">
                    <Ionicons name="add" size={24} color={colors.primary} />
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    reputacion: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    estrellas: { flexDirection: "row", alignItems: "center" },
    input: { alignItems: "center", gap: spacing.md },
    estrellasInput: { flexDirection: "row", justifyContent: "center" },
    estrellaBtn: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
    ajuste: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
    mini: { width: TOUCH, height: TOUCH, borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary, alignItems: "center", justifyContent: "center" },
    numero: { minWidth: 48, textAlign: "center" }
})
