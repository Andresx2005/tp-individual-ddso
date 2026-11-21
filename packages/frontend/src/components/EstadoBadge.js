import React from "react"
import { StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import { ESTADOS } from "../utils/estados"
import { radius, spacing } from "../theme"

export default function EstadoBadge({ estado, grande = false, completo = true }) {
    const e = ESTADOS[estado]
    if (!e) return null
    return (
        <View
            accessible
            accessibilityLabel={`Estado: ${e.label}`}
            style={[styles.badge, { backgroundColor: e.bg }, grande && styles.grande]}
        >
            <Ionicons name={e.icon} size={grande ? 20 : 16} color={e.fg} />
            <Text variant={grande ? "bodyBold" : "label"} color={e.fg}>{completo ? e.label : e.corto}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: spacing.xs,
        paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: radius.pill
    },
    grande: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg }
})
