import React, { useState } from "react"
import { Pressable, StyleSheet, TextInput, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import { colors, fonts, radius, spacing, TOUCH } from "../theme"

// Campo de formulario accesible: la etiqueta SIEMPRE visible (no sólo placeholder), error con ícono + texto
// anunciado por el lector de pantalla, y contador cuando hay límite de caracteres.
export default function TextField({
    label, value, onChangeText, error, hint, optional = false, secure = false, multiline = false,
    maxLength, showCounter = false, inputRef, style, ...rest
}) {
    const [foco, setFoco] = useState(false)
    const [visible, setVisible] = useState(false)

    return (
        <View style={[styles.wrap, style]}>
            <Text variant="label" color={colors.text}>
                {label}{optional ? <Text variant="caption" color={colors.textMuted}>  (opcional)</Text> : null}
            </Text>
            <View style={[styles.box, foco && styles.boxFoco, !!error && styles.boxError]}>
                <TextInput
                    ref={inputRef}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={() => setFoco(true)}
                    onBlur={() => setFoco(false)}
                    secureTextEntry={secure && !visible}
                    multiline={multiline}
                    maxLength={maxLength}
                    accessibilityLabel={label}
                    accessibilityHint={hint}
                    placeholderTextColor={colors.textMuted}
                    allowFontScaling
                    maxFontSizeMultiplier={1.6}
                    textAlignVertical={multiline ? "top" : "center"}
                    style={[styles.input, multiline && styles.multiline]}
                    {...rest}
                />
                {secure && (
                    <Pressable
                        onPress={() => setVisible((v) => !v)}
                        accessibilityRole="button"
                        accessibilityLabel={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
                        style={styles.toggle}
                    >
                        <Ionicons name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={colors.textMuted} />
                    </Pressable>
                )}
            </View>
            <View style={styles.pie}>
                <View style={styles.pieIzq} accessibilityLiveRegion="polite">
                    {error
                        ? (
                            <View style={styles.errorRow}>
                                <Ionicons name="alert-circle" size={16} color={colors.danger} />
                                <Text variant="caption" color={colors.danger} style={styles.errorTxt}>{error}</Text>
                            </View>
                        )
                        : hint ? <Text variant="caption" color={colors.textMuted}>{hint}</Text> : null}
                </View>
                {showCounter && maxLength ? (
                    <Text variant="caption" color={colors.textMuted}>{(value ?? "").length}/{maxLength}</Text>
                ) : null}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.xs },
    box: {
        flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md,
        borderWidth: 1.5, borderColor: colors.borderStrong, minHeight: TOUCH + 4
    },
    boxFoco: { borderColor: colors.primary, borderWidth: 2.5 },
    boxError: { borderColor: colors.danger, borderWidth: 2 },
    input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    multiline: { minHeight: 110 },
    toggle: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
    pie: { flexDirection: "row", justifyContent: "space-between", minHeight: 4 },
    pieIzq: { flex: 1 },
    errorRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    errorTxt: { flexShrink: 1 }
})
