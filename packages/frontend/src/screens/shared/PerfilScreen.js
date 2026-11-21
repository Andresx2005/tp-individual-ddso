import React from "react"
import { Alert, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import Button from "../../components/Button"
import { useAuth } from "../../context/AuthContext"
import { colors, radius, spacing } from "../../theme"

export default function PerfilScreen() {
    const { user, logout, esOrganizador } = useAuth()

    function confirmarSalida() {
        // Confirmación antes de una acción que corta el flujo (heurística 5).
        Alert.alert("Cerrar sesión", "¿Querés salir de tu cuenta?", [
            { text: "Cancelar", style: "cancel" },
            { text: "Cerrar sesión", style: "destructive", onPress: logout }
        ])
    }

    return (
        <Screen edges={["left", "right"]}>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.card}>
                    <View style={styles.avatar}><Ionicons name="person" size={40} color={colors.primary} /></View>
                    <Text variant="title" header style={{ textAlign: "center" }}>{user?.nombre} {user?.apellido}</Text>
                    <Text color={colors.textMuted}>{user?.email}</Text>
                    <View style={styles.rol}>
                        <Ionicons name={esOrganizador ? "megaphone" : "ticket"} size={18} color={colors.primaryDark} />
                        <Text variant="label" color={colors.primaryDark}>{esOrganizador ? "Organizador" : "Comprador"}</Text>
                    </View>
                </View>
                <Button title="Cerrar sesión" icon="log-out-outline" variant="danger" onPress={confirmarSalida} />
                <Text variant="caption" color={colors.textMuted} style={{ textAlign: "center" }}>AI Ticket It · versión 1.0.0</Text>
            </ScrollView>
        </Screen>
    )
}

const styles = StyleSheet.create({
    scroll: { padding: spacing.xl, gap: spacing.xl },
    card: { alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, padding: spacing.xl, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
    avatar: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
    rol: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: colors.primaryTint, paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: radius.pill }
})
