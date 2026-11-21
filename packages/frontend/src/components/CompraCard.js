import React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import EstadoBadge from "./EstadoBadge"
import { colors, radius, shadow, spacing } from "../theme"
import { ESTADOS } from "../utils/estados"
import { formatFechaHora, formatPrecio, plural, textoDias } from "../utils/format"

// Tarjeta de una compra. Jerarquía visual: estado (qué pasa) -> evento (de qué) -> detalle (cuánto).
// Para el comprador, si está CONFIRMADA, destaca cuántos días faltan (caso de uso).
export default function CompraCard({ compra, onPress, mostrarComprador = false }) {
    const dias = compra.estado === "CONFIRMADA" ? textoDias(compra.diasParaEvento) : null
    const resumen = `${compra.evento?.nombre}. ${ESTADOS[compra.estado]?.label}. ${dias ?? ""} ${plural(compra.cantidad, "entrada", "entradas")} ${compra.tipoEntrada?.nombre}. Total ${formatPrecio(compra.total)}`
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={resumen}
            accessibilityHint="Abre el detalle de la compra"
            style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
        >
            <View style={styles.cabecera}>
                <EstadoBadge estado={compra.estado} />
                {dias ? (
                    <View style={styles.dias}>
                        <Ionicons name="hourglass-outline" size={16} color={colors.primaryDark} />
                        <Text variant="label" color={colors.primaryDark}>{dias}</Text>
                    </View>
                ) : null}
            </View>
            <Text variant="subtitle" numberOfLines={2}>{compra.evento?.nombre}</Text>
            {compra.evento?.fecha ? <Text color={colors.textMuted}>{formatFechaHora(compra.evento.fecha)}</Text> : null}
            {mostrarComprador && compra.comprador ? (
                <View style={styles.fila}>
                    <Ionicons name="person-outline" size={18} color={colors.textMuted} />
                    <Text color={colors.textMuted}>{compra.comprador.nombre} {compra.comprador.apellido}</Text>
                </View>
            ) : null}
            <View style={styles.pie}>
                <Text color={colors.text}>{compra.cantidad} × {compra.tipoEntrada?.nombre}</Text>
                <Text variant="bodyBold">{formatPrecio(compra.total)}</Text>
            </View>
            {compra.cantidadMensajes > 0 ? (
                <View style={styles.fila}>
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                    <Text variant="caption" color={colors.primary}>{plural(compra.cantidadMensajes, "mensaje", "mensajes")}</Text>
                </View>
            ) : null}
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.xs, borderWidth: 1, borderColor: colors.border, ...shadow },
    cabecera: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.xs },
    dias: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.primaryTint, paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: radius.pill },
    fila: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    pie: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border }
})
