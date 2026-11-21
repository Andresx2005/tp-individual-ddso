import React from "react"
import { Pressable, StyleSheet } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import { colors, radius, spacing } from "../theme"

// Chip de filtro / selección. El estado "seleccionado" se ve con color + check (no sólo color) y se anuncia.
export default function Chip({ label, selected = false, onPress, count, accessibilityLabel, style }) {
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? (count !== undefined ? `${label}, ${count}` : label)}
            accessibilityState={{ selected }}
            hitSlop={{ top: 4, bottom: 4 }}
            style={[styles.chip, selected && styles.selected, style]}
        >
            {selected && <Ionicons name="checkmark" size={16} color={colors.onPrimary} />}
            <Text variant="label" color={selected ? colors.onPrimary : colors.text}>
                {label}{count !== undefined ? ` · ${count}` : ""}
            </Text>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    chip: {
        minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.lg,
        borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderStrong
    },
    selected: { backgroundColor: colors.primary, borderColor: colors.primary }
})
