import React from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import { colors, radius, spacing, TOUCH } from "../theme"

// Selector de cantidad con botones − / + grandes (más fácil que tipear en el celular) y valor accesible.
export default function Stepper({ value, min = 1, max = 99, onChange, label }) {
    const menos = () => onChange(Math.max(min, value - 1))
    const mas = () => onChange(Math.min(max, value + 1))
    return (
        <View
            style={styles.row}
            accessible
            accessibilityRole="adjustable"
            accessibilityLabel={label}
            accessibilityValue={{ min, max, now: value, text: `${value}` }}
            accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
            onAccessibilityAction={(e) => (e.nativeEvent.actionName === "increment" ? mas() : menos())}
        >
            <Pressable onPress={menos} disabled={value <= min} style={[styles.btn, value <= min && styles.off]} importantForAccessibility="no">
                <Ionicons name="remove" size={26} color={colors.primary} />
            </Pressable>
            <Text variant="title" style={styles.valor}>{value}</Text>
            <Pressable onPress={mas} disabled={value >= max} style={[styles.btn, value >= max && styles.off]} importantForAccessibility="no">
                <Ionicons name="add" size={26} color={colors.primary} />
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
    btn: {
        width: TOUCH + 4, height: TOUCH + 4, borderRadius: radius.md, borderWidth: 2, borderColor: colors.primary,
        alignItems: "center", justifyContent: "center", backgroundColor: colors.surface
    },
    off: { opacity: 0.35 },
    valor: { minWidth: 40, textAlign: "center" }
})
