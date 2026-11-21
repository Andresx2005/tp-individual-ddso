import React from "react"
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import { colors, radius, spacing, TOUCH } from "../theme"

const VARIANTES = {
    primary: { bg: colors.primary, pressed: colors.primaryDark, fg: colors.onPrimary, border: colors.primary },
    accent: { bg: colors.accent, pressed: "#D99800", fg: colors.onAccent, border: colors.accent },
    secondary: { bg: colors.surface, pressed: colors.primaryTint, fg: colors.primary, border: colors.primary },
    danger: { bg: colors.surface, pressed: colors.dangerTint, fg: colors.danger, border: colors.danger },
    ghost: { bg: "transparent", pressed: colors.primaryTint, fg: colors.primary, border: "transparent" }
}

export default function Button({
    title, onPress, variant = "primary", icon, loading = false, disabled = false, style,
    accessibilityLabel, accessibilityHint, fullWidth = true
}) {
    const v = VARIANTES[variant]
    const inactivo = disabled || loading
    return (
        <Pressable
            onPress={inactivo ? undefined : onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityHint={accessibilityHint}
            accessibilityState={{ disabled: inactivo, busy: loading }}
            style={({ pressed }) => [
                styles.base,
                { backgroundColor: pressed && !inactivo ? v.pressed : v.bg, borderColor: v.border },
                !fullWidth && styles.auto,
                disabled && styles.disabled,
                style
            ]}
        >
            <View style={styles.row}>
                {loading
                    ? <ActivityIndicator color={v.fg} />
                    : icon && <Ionicons name={icon} size={20} color={v.fg} />}
                <Text variant="bodyBold" color={v.fg} style={styles.title}>{title}</Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    base: {
        minHeight: TOUCH + 4, borderRadius: radius.md, borderWidth: 2, paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm, justifyContent: "center", alignSelf: "stretch"
    },
    auto: { alignSelf: "flex-start" },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
    title: { textAlign: "center", flexShrink: 1 },
    disabled: { opacity: 0.5 }
})
