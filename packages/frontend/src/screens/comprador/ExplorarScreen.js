import React, { useMemo, useState } from "react"
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Text from "../../components/Text"
import Button from "../../components/Button"
import Chip from "../../components/Chip"
import TextField from "../../components/TextField"
import BottomSheet from "../../components/BottomSheet"
import EventoCard from "../../components/EventoCard"
import { EmptyState, ErrorState, LoadingView } from "../../components/States"
import { listarCategorias, listarEventos } from "../../api/eventos"
import { useAuth } from "../../context/AuthContext"
import { useFavoritos } from "../../context/FavoritosContext"
import useDebounce from "../../hooks/useDebounce"
import usePaginated from "../../hooks/usePaginated"
import useRequest from "../../hooks/useRequest"
import { colors, fonts, radius, spacing, TOUCH } from "../../theme"
import { parseNumero, plural } from "../../utils/format"
import { PAGE_SIZE } from "../../config"

// Opciones de orden en lenguaje humano, mapeadas a ordenarPor/orden del backend.
const ORDENES = [
    { id: "fecha-asc", label: "Más próximos primero", ordenarPor: "fecha", orden: "asc" },
    { id: "fecha-desc", label: "Más lejanos primero", ordenarPor: "fecha", orden: "desc" },
    { id: "precio-asc", label: "Precio: de menor a mayor", ordenarPor: "precio", orden: "asc" },
    { id: "precio-desc", label: "Precio: de mayor a menor", ordenarPor: "precio", orden: "desc" },
    { id: "puntaje-desc", label: "Mejor puntaje del organizador", ordenarPor: "puntaje", orden: "desc" }
]
const ORDEN_DEFECTO = "fecha-asc"

export default function ExplorarScreen({ navigation }) {
    const insets = useSafeAreaInsets()
    const { user } = useAuth()
    const { esFavorito, alternar } = useFavoritos()
    const [texto, setTexto] = useState("")
    const [categoriaId, setCategoriaId] = useState(null)
    const [filtros, setFiltros] = useState({ ordenId: ORDEN_DEFECTO, precioMin: "", precioMax: "" })
    const [hoja, setHoja] = useState(false)
    const q = useDebounce(texto.trim(), 400)

    const categorias = useRequest(listarCategorias, [])
    const orden = ORDENES.find((o) => o.id === filtros.ordenId)

    const lista = usePaginated(
        (page) => listarEventos({
            q, categoriaId, ordenarPor: orden.ordenarPor, orden: orden.id === ORDEN_DEFECTO ? undefined : orden.orden,
            precioMin: filtros.precioMin ? parseNumero(filtros.precioMin) : undefined,
            precioMax: filtros.precioMax ? parseNumero(filtros.precioMax) : undefined,
            page, limit: PAGE_SIZE
        }),
        [q, categoriaId, filtros.ordenId, filtros.precioMin, filtros.precioMax]
    )

    const filtrosActivos = (filtros.ordenId !== ORDEN_DEFECTO ? 1 : 0) + (filtros.precioMin ? 1 : 0) + (filtros.precioMax ? 1 : 0)
    const hayBusqueda = !!q || !!categoriaId || filtrosActivos > 0

    const limpiarTodo = () => { setTexto(""); setCategoriaId(null); setFiltros({ ordenId: ORDEN_DEFECTO, precioMin: "", precioMax: "" }) }

    const encabezado = useMemo(() => (
        <View style={styles.encabezadoLista}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} accessibilityLabel="Categorías">
                <Chip label="Todas" selected={categoriaId === null} onPress={() => setCategoriaId(null)} />
                {(categorias.data ?? []).map((c) => (
                    <Chip key={c.id} label={c.nombre} selected={categoriaId === c.id} onPress={() => setCategoriaId(categoriaId === c.id ? null : c.id)} />
                ))}
            </ScrollView>
            {!lista.loading && !lista.error && (
                <View style={styles.resumen} accessibilityLiveRegion="polite">
                    <Text color={colors.textMuted}>{plural(lista.total, "evento", "eventos")}</Text>
                    <Text variant="caption" color={colors.textMuted}>{orden.label}</Text>
                </View>
            )}
        </View>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [categorias.data, categoriaId, lista.loading, lista.error, lista.total, orden.label])

    return (
        <View style={styles.root}>
            {/* Cabecera verde: saludo + búsqueda + filtros. La búsqueda está siempre a mano (patrón de exploración móvil). */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <Text variant="title" color={colors.onPrimary} header>Hola, {user?.nombre} 👋</Text>
                <Text color={colors.onPrimary}>¿Qué evento te gustaría ver?</Text>
                <View style={styles.buscador}>
                    <View style={styles.input}>
                        <Ionicons name="search" size={22} color={colors.textMuted} />
                        <TextInput
                            value={texto}
                            onChangeText={setTexto}
                            placeholder="Buscar por nombre o descripción"
                            placeholderTextColor={colors.textMuted}
                            accessibilityLabel="Buscar eventos"
                            accessibilityRole="search"
                            returnKeyType="search"
                            autoCorrect={false}
                            maxFontSizeMultiplier={1.6}
                            style={styles.textInput}
                        />
                        {texto.length > 0 && (
                            <Pressable onPress={() => setTexto("")} accessibilityRole="button" accessibilityLabel="Borrar búsqueda" style={styles.borrar}>
                                <Ionicons name="close-circle" size={22} color={colors.textMuted} />
                            </Pressable>
                        )}
                    </View>
                    <Pressable
                        onPress={() => setHoja(true)}
                        accessibilityRole="button"
                        accessibilityLabel={filtrosActivos ? `Ordenar y filtrar, ${plural(filtrosActivos, "filtro activo", "filtros activos")}` : "Ordenar y filtrar"}
                        style={styles.filtroBtn}
                    >
                        <Ionicons name="options" size={24} color={colors.primary} />
                        {filtrosActivos > 0 && (
                            <View style={styles.badge}><Text variant="label" color={colors.onAccent}>{filtrosActivos}</Text></View>
                        )}
                    </Pressable>
                </View>
            </View>

            {lista.loading ? (
                <View style={{ flex: 1 }}>{encabezado}<LoadingView mensaje="Buscando eventos…" /></View>
            ) : lista.error ? (
                <View style={{ flex: 1 }}>{encabezado}<ErrorState error={lista.error} onReintentar={lista.reload} /></View>
            ) : (
                <FlatList
                    data={lista.items}
                    keyExtractor={(e) => String(e.id)}
                    ListHeaderComponent={encabezado}
                    contentContainerStyle={styles.lista}
                    ItemSeparatorComponent={() => <View style={{ height: spacing.lg }} />}
                    renderItem={({ item }) => (
                        <View style={styles.item}>
                            <EventoCard
                                evento={item}
                                mostrarFavorito
                                esFavorito={esFavorito(item.id)}
                                onToggleFavorito={() => alternar(item.id)}
                                onPress={() => navigation.navigate("EventoDetalle", { id: item.id })}
                            />
                        </View>
                    )}
                    onEndReached={lista.loadMore}
                    onEndReachedThreshold={0.4}
                    refreshControl={<RefreshControl refreshing={lista.refreshing} onRefresh={lista.refresh} colors={[colors.primary]} tintColor={colors.primary} />}
                    ListEmptyComponent={
                        <EmptyState
                            icon="search-outline"
                            titulo={hayBusqueda ? "No encontramos eventos" : "Todavía no hay eventos"}
                            mensaje={hayBusqueda ? "Probá con otras palabras, otra categoría o quitá algún filtro." : "Volvé a mirar más tarde."}
                            accion={hayBusqueda ? "Limpiar búsqueda y filtros" : undefined}
                            onAccion={limpiarTodo}
                        />
                    }
                    ListFooterComponent={
                        lista.loadingMore ? <ActivityIndicator style={styles.footer} color={colors.primary} />
                            : lista.moreError ? <View style={styles.footer}><Button title="No se pudo cargar más. Reintentar" variant="secondary" onPress={lista.loadMore} /></View>
                                : null
                    }
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                />
            )}

            <FiltrosSheet visible={hoja} onClose={() => setHoja(false)} valor={filtros} onAplicar={(f) => { setFiltros(f); setHoja(false) }} />
        </View>
    )
}

function FiltrosSheet({ visible, onClose, valor, onAplicar }) {
    const [borrador, setBorrador] = useState(valor)
    const [error, setError] = useState(null)

    // Cada vez que se abre, arranca desde los filtros vigentes.
    React.useEffect(() => { if (visible) { setBorrador(valor); setError(null) } }, [visible, valor])

    function aplicar() {
        const min = borrador.precioMin ? parseNumero(borrador.precioMin) : null
        const max = borrador.precioMax ? parseNumero(borrador.precioMax) : null
        if ((min !== null && (Number.isNaN(min) || min < 0)) || (max !== null && (Number.isNaN(max) || max < 0))) return setError("Ingresá sólo números mayores o iguales a 0.")
        if (min !== null && max !== null && min > max) return setError("El precio mínimo no puede ser mayor que el máximo.")
        onAplicar(borrador)
    }

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            title="Ordenar y filtrar"
            footer={
                <>
                    <Button title="Ver resultados" onPress={aplicar} />
                    <Button title="Restablecer" variant="ghost" onPress={() => { setBorrador({ ordenId: ORDEN_DEFECTO, precioMin: "", precioMax: "" }); setError(null) }} />
                </>
            }
        >
            <Text variant="subtitle" header>Ordenar por</Text>
            <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
                {ORDENES.map((o) => {
                    const activo = borrador.ordenId === o.id
                    return (
                        <Pressable
                            key={o.id}
                            onPress={() => setBorrador((b) => ({ ...b, ordenId: o.id }))}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: activo }}
                            style={[styles.opcion, activo && styles.opcionActiva]}
                        >
                            <Ionicons name={activo ? "radio-button-on" : "radio-button-off"} size={24} color={activo ? colors.primary : colors.borderStrong} />
                            <Text variant={activo ? "bodyBold" : "body"}>{o.label}</Text>
                        </Pressable>
                    )
                })}
            </View>
            <Text variant="subtitle" header>Rango de precio</Text>
            <Text variant="caption" color={colors.textMuted}>Se muestran los eventos con al menos un tipo de entrada dentro del rango.</Text>
            <View style={styles.precios}>
                <TextField style={{ flex: 1 }} label="Mínimo ($)" value={borrador.precioMin} onChangeText={(v) => setBorrador((b) => ({ ...b, precioMin: v }))} keyboardType="decimal-pad" />
                <TextField style={{ flex: 1 }} label="Máximo ($)" value={borrador.precioMax} onChangeText={(v) => setBorrador((b) => ({ ...b, precioMax: v }))} keyboardType="decimal-pad" />
            </View>
            {error ? (
                <View style={styles.errorRow} accessibilityLiveRegion="assertive">
                    <Ionicons name="alert-circle" size={18} color={colors.danger} />
                    <Text color={colors.danger} style={{ flex: 1 }}>{error}</Text>
                </View>
            ) : null}
        </BottomSheet>
    )
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: { backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xs, borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg },
    buscador: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
    input: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, paddingLeft: spacing.md, minHeight: TOUCH + 4 },
    textInput: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingVertical: spacing.sm },
    borrar: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
    filtroBtn: { width: TOUCH + 4, height: TOUCH + 4, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
    badge: { position: "absolute", top: -6, right: -6, minWidth: 22, height: 22, borderRadius: 11, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" },
    encabezadoLista: { paddingTop: spacing.lg, gap: spacing.md },
    chips: { gap: spacing.sm, paddingHorizontal: spacing.lg },
    resumen: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg },
    lista: { paddingBottom: spacing.xxl, flexGrow: 1 },
    item: { paddingHorizontal: spacing.lg },
    footer: { padding: spacing.lg },
    opcion: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: TOUCH, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
    opcionActiva: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
    precios: { flexDirection: "row", gap: spacing.md },
    errorRow: { flexDirection: "row", gap: spacing.xs, alignItems: "center" }
})
