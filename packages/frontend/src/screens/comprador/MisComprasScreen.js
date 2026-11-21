import React, { useMemo, useState } from "react"
import { FlatList, RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import Screen from "../../components/Screen"
import Chip from "../../components/Chip"
import CompraCard from "../../components/CompraCard"
import { EmptyState, ErrorState, LoadingView } from "../../components/States"
import { listarMisCompras } from "../../api/compras"
import useRefreshOnFocus from "../../hooks/useRefreshOnFocus"
import useRequest from "../../hooks/useRequest"
import { colors, spacing } from "../../theme"
import { ESTADOS, ORDEN_ESTADOS } from "../../utils/estados"

// Prioridad para ordenar: lo que requiere acción o está por ocurrir va primero.
const PRIORIDAD = { PENDIENTE: 0, CONFIRMADA: 1, UTILIZADA: 2, REEMBOLSADA: 3, CANCELADA: 4 }

export default function MisComprasScreen({ navigation }) {
    const [filtro, setFiltro] = useState(null)
    const [refrescando, setRefrescando] = useState(false)
    // Se piden todas una vez y se filtra en el dispositivo: los filtros responden al instante y muestran cantidades.
    const { data, loading, error, reload } = useRequest(() => listarMisCompras(), [])
    useRefreshOnFocus(() => reload({ silent: true }))

    const conteos = useMemo(() => {
        const c = {}
        for (const compra of data ?? []) c[compra.estado] = (c[compra.estado] ?? 0) + 1
        return c
    }, [data])

    const visibles = useMemo(() => {
        const lista = (data ?? []).filter((c) => !filtro || c.estado === filtro)
        return lista.sort((a, b) => {
            if (a.estado !== b.estado) return PRIORIDAD[a.estado] - PRIORIDAD[b.estado]
            if (a.estado === "CONFIRMADA") return (a.diasParaEvento ?? 9999) - (b.diasParaEvento ?? 9999) // la más cercana primero
            return new Date(b.creadaEn) - new Date(a.creadaEn)
        })
    }, [data, filtro])

    if (loading) return <Screen><LoadingView mensaje="Cargando tus compras…" /></Screen>
    if (error && !data) return <Screen><ErrorState error={error} onReintentar={reload} /></Screen>

    const estadosConCompras = ORDEN_ESTADOS.filter((e) => conteos[e])

    return (
        <Screen>
            <FlatList
                data={visibles}
                keyExtractor={(c) => String(c.id)}
                contentContainerStyle={styles.lista}
                ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
                ListHeaderComponent={
                    (data ?? []).length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Filtrar por estado">
                            <Chip label="Todas" count={data.length} selected={!filtro} onPress={() => setFiltro(null)} />
                            {estadosConCompras.map((e) => (
                                <Chip key={e} label={ESTADOS[e].corto} count={conteos[e]} selected={filtro === e} onPress={() => setFiltro(filtro === e ? null : e)} />
                            ))}
                        </ScrollView>
                    ) : null
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refrescando}
                        onRefresh={async () => { setRefrescando(true); await reload({ silent: true }); setRefrescando(false) }}
                        colors={[colors.primary]}
                    />
                }
                renderItem={({ item }) => (
                    <CompraCard compra={item} onPress={() => navigation.navigate("CompraDetalle", { id: item.id })} />
                )}
                ListEmptyComponent={
                    <EmptyState
                        icon="ticket-outline"
                        titulo={filtro ? "No tenés compras en este estado" : "Todavía no compraste entradas"}
                        mensaje={filtro ? "Probá con otro filtro." : "Cuando compres entradas las vas a ver acá, con su estado y los días que faltan."}
                        accion={filtro ? "Ver todas" : "Explorar eventos"}
                        onAccion={() => (filtro ? setFiltro(null) : navigation.navigate("Explorar"))}
                    />
                }
            />
        </Screen>
    )
}

const styles = StyleSheet.create({
    lista: { padding: spacing.lg, flexGrow: 1 },
    chips: { gap: spacing.sm, paddingBottom: spacing.lg }
})
