import React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import { Reputacion } from "./Puntaje"
import { colors, radius, shadow, spacing, TOUCH } from "../theme"
import { formatFechaHora, formatPrecio } from "../utils/format"

const precioDesde = (e) => e.precioMinimo ?? (e.tiposEntrada?.length ? Math.min(...e.tiposEntrada.map((t) => t.precio)) : null)

export default function EventoCard({ evento, onPress, mostrarFavorito = false, esFavorito = false, onToggleFavorito }) {
    const precio = precioDesde(evento)
    const tieneReputacion = evento.organizadorReputacion !== undefined

    return (
        <View style={styles.wrap}>
            {/* La tarjeta entera es un único objetivo táctil; el corazón es un hermano (no anidado) para que ambos sean accesibles */}
            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={`${evento.nombre}. ${formatFechaHora(evento.fecha)}. ${precio !== null ? "Desde " + formatPrecio(precio) : ""}`}
                accessibilityHint="Abre el detalle del evento"
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            >
                <View style={styles.info}>
                    {/* Deja libre el costado derecho para que el corazón no tape el título */}
                    <View style={mostrarFavorito && styles.conCorazon}>
                        {evento.categoria?.nombre ? <Text variant="label" color={colors.primary}>{evento.categoria.nombre.toUpperCase()}</Text> : null}
                        <Text variant="subtitle" numberOfLines={2}>{evento.nombre}</Text>
                    </View>
                    <View style={styles.fila}>
                        <Ionicons name="calendar-outline" size={18} color={colors.textMuted} />
                        <Text color={colors.textMuted}>{formatFechaHora(evento.fecha)}</Text>
                    </View>
                    <View style={styles.pie}>
                        <View style={styles.flex}>
                            {evento.organizador ? <Text variant="caption" color={colors.textMuted} numberOfLines={1}>Por {evento.organizador.nombre} {evento.organizador.apellido}</Text> : null}
                            {tieneReputacion ? <Reputacion reputacion={evento.organizadorReputacion} compacto /> : null}
                        </View>
                        {precio !== null && (
                            <View style={styles.precio}>
                                <Text variant="caption" color={colors.onAccent}>Desde</Text>
                                <Text variant="bodyBold" color={colors.onAccent}>{formatPrecio(precio)}</Text>
                            </View>
                        )}
                    </View>
                </View>
            </Pressable>
            {mostrarFavorito && (
                <Pressable
                    onPress={onToggleFavorito}
                    accessibilityRole="button"
                    accessibilityLabel={esFavorito ? `Quitar ${evento.nombre} de favoritos` : `Guardar ${evento.nombre} en favoritos`}
                    accessibilityState={{ selected: esFavorito }}
                    style={styles.corazon}
                >
                    <Ionicons name={esFavorito ? "heart" : "heart-outline"} size={26} color={esFavorito ? colors.danger : colors.text} />
                </Pressable>
            )}
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: { position: "relative" },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", borderWidth: 1, borderColor: colors.border, ...shadow },
    info: { padding: spacing.lg, gap: spacing.xs },
    conCorazon: { paddingRight: TOUCH },
    fila: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    pie: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: spacing.md, marginTop: spacing.sm },
    flex: { flex: 1, gap: 2 },
    precio: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.xs, paddingHorizontal: spacing.md, alignItems: "flex-end" },
    corazon: {
        position: "absolute", top: spacing.sm, right: spacing.sm, width: TOUCH, height: TOUCH, borderRadius: TOUCH / 2,
        backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center"
    }
})
