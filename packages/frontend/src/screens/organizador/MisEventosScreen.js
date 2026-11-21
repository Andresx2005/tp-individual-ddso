import React from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import Button from "../../components/Button"
import EventoCard from "../../components/EventoCard"
import { EmptyState, ErrorState, LoadingView } from "../../components/States"
import { listarEventos } from "../../api/eventos"
import { useAuth } from "../../context/AuthContext"
import usePaginated from "../../hooks/usePaginated"
import useRefreshOnFocus from "../../hooks/useRefreshOnFocus"
import { PAGE_SIZE } from "../../config"
import { colors, radius, shadow, spacing, TOUCH } from "../../theme"
import { plural } from "../../utils/format"

export default function MisEventosScreen({ navigation }) {
    const { user } = useAuth()
    // El backend lista eventos futuros; se filtra por organizadorId = yo.
    const lista = usePaginated(
        (page) => listarEventos({ organizadorId: user.id, ordenarPor: "fecha", page, limit: PAGE_SIZE }),
        [user.id]
    )
    useRefreshOnFocus(lista.silent) // al volver de crear un evento aparece en la lista

    const nuevo = () => navigation.navigate("CrearEvento")

    if (lista.loading) return <Screen><LoadingView mensaje="Cargando tus eventos…" /></Screen>
    if (lista.error) return <Screen><ErrorState error={lista.error} onReintentar={lista.reload} /></Screen>

    return (
        <Screen edges={["left", "right"]}>
            <FlatList
                data={lista.items}
                keyExtractor={(e) => String(e.id)}
                contentContainerStyle={styles.lista}
                ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
                onEndReached={lista.loadMore}
                onEndReachedThreshold={0.4}
                refreshControl={<RefreshControl refreshing={lista.refreshing} onRefresh={lista.refresh} colors={[colors.primary]} />}
                ListHeaderComponent={lista.items.length > 0 ? <Text color={colors.textMuted} style={{ marginBottom: spacing.md }}>{plural(lista.total, "evento próximo", "eventos próximos")} · tocá uno para ver sus compras</Text> : null}
                renderItem={({ item }) => (
                    <EventoCard evento={item} onPress={() => navigation.navigate("EventoCompras", { id: item.id, nombre: item.nombre })} />
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="calendar-outline"
                        titulo="Todavía no publicaste eventos"
                        mensaje="Creá tu primer evento, definí los tipos de entrada y empezá a vender."
                        accion="Crear un evento"
                        onAccion={nuevo}
                    />
                }
                ListFooterComponent={lista.loadingMore ? <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} /> : lista.moreError ? <Button title="No se pudo cargar más. Reintentar" variant="secondary" onPress={lista.loadMore} /> : null}
            />
            {/* Acción principal de la pantalla: botón flotante extendido (con texto, no sólo ícono) */}
            <Pressable onPress={nuevo} accessibilityRole="button" accessibilityLabel="Crear nuevo evento" style={({ pressed }) => [styles.fab, pressed && { backgroundColor: colors.primaryDark }]}>
                <Ionicons name="add" size={26} color={colors.onPrimary} />
                <Text variant="bodyBold" color={colors.onPrimary}>Nuevo evento</Text>
            </Pressable>
        </Screen>
    )
}

const styles = StyleSheet.create({
    lista: { padding: spacing.lg, paddingBottom: 110, flexGrow: 1 },
    fab: {
        position: "absolute", right: spacing.lg, bottom: spacing.lg, minHeight: TOUCH + 8, flexDirection: "row", alignItems: "center", gap: spacing.sm,
        paddingHorizontal: spacing.xl, borderRadius: radius.pill, backgroundColor: colors.primary, ...shadow, elevation: 6
    }
})
