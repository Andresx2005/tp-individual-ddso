import React, { useState } from "react"
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import Button from "../../components/Button"
import Chip from "../../components/Chip"
import CompraCard from "../../components/CompraCard"
import { EmptyState, ErrorState, LoadingView } from "../../components/States"
import { comprasDeEvento } from "../../api/eventos"
import useRefreshOnFocus from "../../hooks/useRefreshOnFocus"
import useRequest from "../../hooks/useRequest"
import { colors, radius, spacing } from "../../theme"
import { ESTADOS, ORDEN_ESTADOS } from "../../utils/estados"
import { formatFechaHora, formatPrecio, plural } from "../../utils/format"

export default function EventoComprasScreen({ route, navigation }) {
    const { id } = route.params
    const [estado, setEstado] = useState(null)
    const [refrescando, setRefrescando] = useState(false)
    const { data, loading, error, reload } = useRequest(() => comprasDeEvento(id, estado ?? undefined), [id, estado])
    useRefreshOnFocus(() => reload({ silent: true }))

    // Navegación: título del header con el nombre del evento (mantiene el contexto).
    React.useLayoutEffect(() => { if (route.params.nombre) navigation.setOptions({ title: route.params.nombre }) }, [navigation, route.params.nombre])

    if (loading && !data) return <Screen><LoadingView mensaje="Cargando compras…" /></Screen>
    if (error && !data) return <Screen><ErrorState error={error} onReintentar={reload} /></Screen>

    const tipos = data?.entradasPorTipo ?? []
    const compras = data?.compras ?? []

    return (
        <Screen>
            <FlatList
                data={compras}
                keyExtractor={(c) => String(c.id)}
                contentContainerStyle={styles.lista}
                ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await reload({ silent: true }); setRefrescando(false) }} colors={[colors.primary]} />}
                ListHeaderComponent={
                    <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
                        {data?.evento?.fecha ? (
                            <View style={styles.fecha}>
                                <Ionicons name="calendar" size={20} color={colors.primary} />
                                <Text variant="bodyBold">{formatFechaHora(data.evento.fecha)}</Text>
                            </View>
                        ) : null}

                        {/* Entradas que quedan por tipo (caso de uso): cupo, vendidas y disponibles de un vistazo */}
                        <View style={{ gap: spacing.sm }}>
                            <Text variant="subtitle" header>Entradas disponibles</Text>
                            {tipos.map((t) => <TipoCupo key={t.id} tipo={t} />)}
                        </View>

                        <View style={{ gap: spacing.sm }}>
                            <Text variant="subtitle" header>Compras ({compras.length})</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar compras por estado">
                                <Chip label="Todas" selected={!estado} onPress={() => setEstado(null)} />
                                {ORDEN_ESTADOS.map((e) => <Chip key={e} label={ESTADOS[e].corto} selected={estado === e} onPress={() => setEstado(estado === e ? null : e)} />)}
                            </ScrollView>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <CompraCard compra={item} mostrarComprador onPress={() => navigation.navigate("CompraDetalle", { id: item.id })} />
                )}
                ListEmptyComponent={
                    loading ? <LoadingView /> : (
                        <EmptyState
                            icon="receipt-outline"
                            titulo={estado ? "No hay compras en este estado" : "Todavía no hay compras"}
                            mensaje={estado ? "Probá con otro filtro." : "Cuando alguien compre entradas para este evento, aparecerá acá."}
                            accion={estado ? "Ver todas" : undefined}
                            onAccion={() => setEstado(null)}
                        />
                    )
                }
                ListFooterComponent={<Button title="Ver ficha pública del evento" variant="ghost" onPress={() => navigation.navigate("EventoDetalle", { id })} />}
            />
        </Screen>
    )
}

function TipoCupo({ tipo }) {
    const pct = tipo.cupo > 0 ? Math.min(100, Math.round((tipo.entradasVendidas / tipo.cupo) * 100)) : 0
    const agotado = tipo.entradasDisponibles <= 0
    return (
        <View style={styles.tipo} accessible accessibilityLabel={`${tipo.nombre}, ${formatPrecio(tipo.precio)}. ${agotado ? "Agotada" : `Quedan ${plural(tipo.entradasDisponibles, "entrada", "entradas")}`} de ${tipo.cupo}. ${tipo.entradasVendidas} vendidas, ${pct} por ciento.`}>
            <View style={styles.tipoCab}>
                <Text variant="bodyBold" style={{ flex: 1 }}>{tipo.nombre} · {formatPrecio(tipo.precio)}</Text>
                <View style={[styles.quedan, agotado && { backgroundColor: colors.dangerTint }]}>
                    <Text variant="label" color={agotado ? colors.dangerDark : colors.primaryDark}>{agotado ? "Agotada" : `Quedan ${tipo.entradasDisponibles}`}</Text>
                </View>
            </View>
            {/* La barra se complementa con texto: el dato nunca depende sólo del gráfico */}
            <View style={styles.barraFondo} importantForAccessibility="no-hide-descendants">
                <View style={[styles.barra, { width: `${pct}%`, backgroundColor: agotado ? colors.danger : colors.primary }]} />
            </View>
            <Text variant="caption" color={colors.textMuted}>{tipo.entradasVendidas} vendidas de {tipo.cupo} ({pct} %)</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    lista: { padding: spacing.lg, flexGrow: 1 },
    fecha: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    chips: { gap: spacing.sm },
    tipo: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
    tipoCab: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    quedan: { backgroundColor: colors.primaryTint, paddingVertical: 2, paddingHorizontal: spacing.md, borderRadius: radius.pill },
    barraFondo: { height: 10, backgroundColor: colors.border, borderRadius: 5, overflow: "hidden" },
    barra: { height: 10, borderRadius: 5 }
})
