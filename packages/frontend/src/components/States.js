import React from "react"
import { ActivityIndicator, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import Button from "./Button"
import { colors, spacing } from "../theme"
import { mensajeDeError } from "../utils/errors"

export function LoadingView({ mensaje = "Cargando…" }) {
    return (
        <View style={styles.center} accessibilityLiveRegion="polite">
            <ActivityIndicator size="large" color={colors.primary} accessibilityLabel={mensaje} />
            <Text variant="caption" color={colors.textMuted}>{mensaje}</Text>
        </View>
    )
}

// Estados vacíos que explican qué pasó y qué hacer (en vez de una pantalla en blanco).
export function EmptyState({ icon = "file-tray-outline", titulo, mensaje, accion, onAccion }) {
    return (
        <View style={styles.center}>
            <View style={styles.iconBox}><Ionicons name={icon} size={36} color={colors.primary} /></View>
            <Text variant="subtitle" header style={styles.centrado}>{titulo}</Text>
            {mensaje ? <Text color={colors.textMuted} style={styles.centrado}>{mensaje}</Text> : null}
            {accion ? <Button title={accion} onPress={onAccion} variant="secondary" fullWidth={false} style={styles.btn} /> : null}
        </View>
    )
}

export function ErrorState({ error, onReintentar, mensaje }) {
    return (
        <View style={styles.center} accessibilityLiveRegion="polite">
            <View style={[styles.iconBox, { backgroundColor: colors.dangerTint }]}>
                <Ionicons name={error?.network ? "cloud-offline-outline" : "alert-circle-outline"} size={36} color={colors.danger} />
            </View>
            <Text variant="subtitle" header style={styles.centrado}>No pudimos cargar esto</Text>
            <Text color={colors.textMuted} style={styles.centrado}>{mensaje ?? mensajeDeError(error)}</Text>
            {onReintentar ? <Button title="Reintentar" icon="refresh" onPress={onReintentar} fullWidth={false} style={styles.btn} /> : null}
        </View>
    )
}

// Banner de error dentro de formularios.
export function Banner({ mensaje, tipo = "error" }) {
    if (!mensaje) return null
    const error = tipo === "error"
    return (
        <View
            style={[styles.banner, { backgroundColor: error ? colors.dangerTint : colors.primaryTint }]}
            accessibilityLiveRegion="assertive"
            accessibilityRole="alert"
        >
            <Ionicons name={error ? "alert-circle" : "information-circle"} size={22} color={error ? colors.dangerDark : colors.primaryDark} />
            <Text color={error ? colors.dangerDark : colors.primaryDark} style={styles.bannerTxt}>{mensaje}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xxl, gap: spacing.md },
    centrado: { textAlign: "center" },
    iconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
    btn: { marginTop: spacing.sm },
    banner: { flexDirection: "row", gap: spacing.sm, padding: spacing.md, borderRadius: 12, alignItems: "flex-start" },
    bannerTxt: { flex: 1 }
})
