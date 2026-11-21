import React from "react"
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Text from "./Text"
import { colors, radius, spacing, TOUCH } from "../theme"

// Hoja inferior: patrón móvil para acciones acotadas (comprar, filtrar) sin perder el contexto de la pantalla.
// Se cierra con la X, tocando afuera o con el botón "atrás" de Android.
export default function BottomSheet({ visible, onClose, title, children, footer }) {
    const insets = useSafeAreaInsets()
    const { height } = useWindowDimensions()
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
            <View style={styles.overlay}>
                <Pressable
                    style={StyleSheet.absoluteFill}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar"
                />
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                    <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]} accessibilityViewIsModal>
                        <View style={styles.header}>
                            <Text variant="title" header style={styles.title}>{title}</Text>
                            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Cerrar" style={styles.close}>
                                <Ionicons name="close" size={26} color={colors.text} />
                            </Pressable>
                        </View>
                        <ScrollView style={{ maxHeight: height * 0.6 }} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
                            {children}
                        </ScrollView>
                        {footer ? <View style={styles.footer}>{footer}</View> : null}
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: colors.overlay },
    sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg + 4, borderTopRightRadius: radius.lg + 4, paddingTop: spacing.sm },
    header: { flexDirection: "row", alignItems: "center", paddingLeft: spacing.xl, paddingRight: spacing.sm },
    title: { flex: 1 },
    close: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
    body: { paddingHorizontal: spacing.xl, paddingVertical: spacing.md, gap: spacing.lg },
    footer: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm }
})
