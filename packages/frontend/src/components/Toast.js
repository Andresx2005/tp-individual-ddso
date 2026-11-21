import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react"
import { AccessibilityInfo, Animated, Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Text from "./Text"
import { colors, radius, spacing, TOUCH } from "../theme"

// Feedback de acciones (heurística 1: visibilidad del estado del sistema).
// Se anuncia a los lectores de pantalla y admite una acción ("Deshacer": heurística 3, control y libertad).
const ToastContext = createContext({ mostrar: () => {} })
export const useToast = () => useContext(ToastContext)

export function ToastProvider({ children }) {
    const insets = useSafeAreaInsets()
    const [toast, setToast] = useState(null)
    const opacity = useRef(new Animated.Value(0)).current
    const timer = useRef(null)

    const ocultar = useCallback(() => {
        Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => setToast(null))
    }, [opacity])

    const mostrar = useCallback((mensaje, { tipo = "ok", accion } = {}) => {
        clearTimeout(timer.current)
        setToast({ mensaje, tipo, accion })
        AccessibilityInfo.announceForAccessibility(mensaje)
        Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start()
        timer.current = setTimeout(ocultar, accion ? 6000 : 3500)
    }, [opacity, ocultar])

    useEffect(() => () => clearTimeout(timer.current), [])
    const value = useMemo(() => ({ mostrar }), [mostrar])
    const esError = toast?.tipo === "error"

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast && (
                <Animated.View
                    style={[styles.wrap, { bottom: insets.bottom + 96, opacity }]}
                    accessibilityLiveRegion="polite"
                    pointerEvents="box-none"
                >
                    <View style={[styles.toast, esError && styles.toastError]}>
                        <Ionicons name={esError ? "alert-circle" : "checkmark-circle"} size={22} color="#FFFFFF" />
                        <Text variant="body" color="#FFFFFF" style={styles.msg}>{toast.mensaje}</Text>
                        {toast.accion && (
                            <Pressable
                                onPress={() => { clearTimeout(timer.current); ocultar(); toast.accion.onPress() }}
                                accessibilityRole="button"
                                style={styles.accion}
                            >
                                <Text variant="label" color="#FFFFFF" style={styles.accionTxt}>{toast.accion.label}</Text>
                            </Pressable>
                        )}
                    </View>
                </Animated.View>
            )}
        </ToastContext.Provider>
    )
}

const styles = StyleSheet.create({
    wrap: { position: "absolute", left: spacing.lg, right: spacing.lg, alignItems: "center" },
    toast: {
        flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.text,
        borderRadius: radius.md, paddingVertical: spacing.md, paddingLeft: spacing.lg, paddingRight: spacing.sm, minHeight: TOUCH
    },
    toastError: { backgroundColor: colors.dangerDark },
    msg: { flexShrink: 1 },
    accion: { minHeight: TOUCH, minWidth: TOUCH, justifyContent: "center", paddingHorizontal: spacing.md },
    accionTxt: { textDecorationLine: "underline" }
})
