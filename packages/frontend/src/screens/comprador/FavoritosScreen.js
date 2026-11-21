import React from "react"
import { FlatList, RefreshControl, StyleSheet, View } from "react-native"
import Screen from "../../components/Screen"
import EventoCard from "../../components/EventoCard"
import { EmptyState, ErrorState, LoadingView } from "../../components/States"
import { useToast } from "../../components/Toast"
import { listarFavoritos } from "../../api/favoritos"
import { useFavoritos } from "../../context/FavoritosContext"
import useRefreshOnFocus from "../../hooks/useRefreshOnFocus"
import useRequest from "../../hooks/useRequest"
import { colors, spacing } from "../../theme"

export default function FavoritosScreen({ navigation }) {
    const { alternar } = useFavoritos()
    const { mostrar } = useToast()
    const { data, loading, error, reload, setData } = useRequest(listarFavoritos, [])
    const [refrescando, setRefrescando] = React.useState(false)
    useRefreshOnFocus(() => reload({ silent: true }))

    async function quitar(evento) {
        const resultado = await alternar(evento.id)
        if (resultado !== false) return
        setData((lista) => (lista ?? []).filter((e) => e.id !== evento.id))
        // Deshacer: control y libertad del usuario ante una acción accidental.
        mostrar("Quitado de favoritos", {
            accion: {
                label: "Deshacer",
                onPress: async () => { await alternar(evento.id); reload({ silent: true }) }
            }
        })
    }

    if (loading) return <Screen><LoadingView /></Screen>
    if (error && !data) return <Screen><ErrorState error={error} onReintentar={reload} /></Screen>

    return (
        <Screen>
            <FlatList
                data={data ?? []}
                keyExtractor={(e) => String(e.id)}
                contentContainerStyle={styles.lista}
                ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await reload({ silent: true }); setRefrescando(false) }} colors={[colors.primary]} />}
                renderItem={({ item }) => (
                    <EventoCard
                        evento={item}
                        mostrarFavorito
                        esFavorito
                        onToggleFavorito={() => quitar(item)}
                        onPress={() => navigation.navigate("EventoDetalle", { id: item.id })}
                    />
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="heart-outline"
                        titulo="Todavía no guardaste favoritos"
                        mensaje="Tocá el corazón de un evento para guardarlo y encontrarlo rápido después."
                        accion="Explorar eventos"
                        onAccion={() => navigation.navigate("Explorar")}
                    />
                }
            />
        </Screen>
    )
}

const styles = StyleSheet.create({ lista: { padding: spacing.lg, flexGrow: 1 } })
