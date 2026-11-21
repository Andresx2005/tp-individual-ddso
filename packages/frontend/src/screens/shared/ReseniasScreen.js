import React from "react"
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from "react-native"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import Button from "../../components/Button"
import { Estrellas, Reputacion } from "../../components/Puntaje"
import { EmptyState, ErrorState, LoadingView } from "../../components/States"
import { reseniasDeEvento } from "../../api/eventos"
import usePaginated from "../../hooks/usePaginated"
import { colors, radius, spacing } from "../../theme"
import { formatFecha } from "../../utils/format"

export default function ReseniasScreen({ route }) {
    const { eventoId } = route.params
    const lista = usePaginated((page) => reseniasDeEvento(eventoId, { page, limit: 10 }), [eventoId])
    const org = lista.meta?.organizador

    if (lista.loading) return <Screen><LoadingView mensaje="Cargando reseñas…" /></Screen>
    if (lista.error) return <Screen><ErrorState error={lista.error} onReintentar={lista.reload} /></Screen>

    return (
        <Screen>
            <FlatList
                data={lista.items}
                keyExtractor={(r) => String(r.id)}
                contentContainerStyle={styles.lista}
                ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                onEndReached={lista.loadMore}
                onEndReachedThreshold={0.4}
                refreshControl={<RefreshControl refreshing={lista.refreshing} onRefresh={lista.refresh} colors={[colors.primary]} />}
                ListHeaderComponent={
                    <View style={styles.cabecera}>
                        <Text variant="caption" color={colors.textMuted}>Reseñas de todos los eventos de</Text>
                        <Text variant="title" header>{org ? `${org.nombre} ${org.apellido}` : "Organizador"}</Text>
                        <Reputacion reputacion={lista.meta?.reputacion} />
                    </View>
                }
                ListEmptyComponent={<EmptyState icon="chatbox-ellipses-outline" titulo="Sin reseñas todavía" mensaje="Cuando los asistentes califiquen sus eventos, las vas a ver acá." />}
                ListFooterComponent={
                    lista.loadingMore ? <ActivityIndicator style={{ padding: spacing.lg }} color={colors.primary} />
                        : lista.moreError ? <Button title="No se pudo cargar más. Reintentar" variant="secondary" onPress={lista.loadMore} /> : null
                }
                renderItem={({ item: r }) => (
                    <View style={styles.card}>
                        <View style={styles.fila}>
                            <Text variant="bodyBold" style={{ flex: 1 }} numberOfLines={1}>{r.comprador?.nombre} {r.comprador?.apellido}</Text>
                            <Estrellas valor={r.puntuacion} />
                        </View>
                        <Text>{r.detalle}</Text>
                        <Text variant="caption" color={colors.textMuted}>
                            {r.evento?.nombre ? `Evento: ${r.evento.nombre}` : ""}{r.creadaEn ? ` · ${formatFecha(r.creadaEn)}` : ""}
                        </Text>
                    </View>
                )}
            />
        </Screen>
    )
}

const styles = StyleSheet.create({
    lista: { padding: spacing.lg, flexGrow: 1 },
    cabecera: { gap: spacing.xs, marginBottom: spacing.lg },
    card: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.sm },
    fila: { flexDirection: "row", alignItems: "center", gap: spacing.sm }
})
