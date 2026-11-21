import React, { useMemo, useState } from "react"
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import Button from "../../components/Button"
import EstadoBadge from "../../components/EstadoBadge"
import { Banner, ErrorState, LoadingView } from "../../components/States"
import { useToast } from "../../components/Toast"
import { cancelarCompra, confirmarPago, historialDeCompra, obtenerCompra } from "../../api/compras"
import { useAuth } from "../../context/AuthContext"
import useRefreshOnFocus from "../../hooks/useRefreshOnFocus"
import useRequest from "../../hooks/useRequest"
import { colors, radius, spacing, TOUCH } from "../../theme"
import { ESTADOS } from "../../utils/estados"
import { formatFechaHora, formatMomento, formatPrecio, plural, textoDias, yaPaso } from "../../utils/format"
import { mensajeDeError } from "../../utils/errors"

export default function CompraDetalleScreen({ route, navigation }) {
    const { id } = route.params
    const { esComprador, user } = useAuth()
    const { mostrar } = useToast()
    const [accion, setAccion] = useState(null) // "pagar" | "cancelar" | null
    const [errorAccion, setErrorAccion] = useState(null)
    const [refrescando, setRefrescando] = useState(false)

    const compra = useRequest(() => obtenerCompra(id), [id])
    const historial = useRequest(() => historialDeCompra(id), [id])
    const recargar = async (silent = true) => { await Promise.all([compra.reload({ silent }), historial.reload({ silent })]) }
    useRefreshOnFocus(() => recargar(true)) // al volver del chat se actualiza el contador de mensajes

    const pasos = useMemo(
        () => [...(historial.data ?? [])].sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora)),
        [historial.data]
    )

    if (compra.loading) return <Screen><LoadingView mensaje="Cargando compra…" /></Screen>
    if (compra.error && !compra.data) return <Screen><ErrorState error={compra.error} onReintentar={compra.reload} /></Screen>

    const c = compra.data
    const estado = ESTADOS[c.estado]
    const rol = esComprador ? "COMPRADOR" : "ORGANIZADOR"
    const eventoPasado = c.evento?.fecha ? yaPaso(c.evento.fecha) : false
    const puedePagar = esComprador && c.estado === "PENDIENTE" && !eventoPasado
    const puedeCancelar = esComprador && (c.estado === "PENDIENTE" || c.estado === "CONFIRMADA") && !eventoPasado
    const puedeCalificar = esComprador && c.estado === "UTILIZADA"
    const dias = c.estado === "CONFIRMADA" ? textoDias(c.diasParaEvento) : null
    const contraparte = esComprador ? "el organizador" : `${c.comprador?.nombre ?? "el comprador"}`

    async function ejecutar(tipo, fn, mensajeOk) {
        setAccion(tipo)
        setErrorAccion(null)
        try {
            const actualizada = await fn(c.id)
            compra.setData(actualizada)
            historial.reload({ silent: true })
            mostrar(mensajeOk)
        } catch (e) {
            setErrorAccion(mensajeDeError(e))
            compra.reload({ silent: true }) // el estado pudo haber cambiado (p. ej. el evento se realizó)
        } finally {
            setAccion(null)
        }
    }

    function pagar() {
        Alert.alert("Confirmar pago", `Vas a pagar ${formatPrecio(c.total)} por ${plural(c.cantidad, "entrada", "entradas")}.`, [
            { text: "Volver", style: "cancel" },
            { text: "Confirmar pago", onPress: () => ejecutar("pagar", confirmarPago, "Pago confirmado. ¡Tus entradas están aseguradas!") }
        ])
    }

    function cancelar() {
        const reembolso = c.estado === "CONFIRMADA"
        Alert.alert(
            "¿Cancelar esta compra?",
            reembolso
                ? `Se te va a reembolsar ${formatPrecio(c.total)} y las entradas vuelven a estar disponibles. Esta acción no se puede deshacer.`
                : "Las entradas vuelven a estar disponibles. Esta acción no se puede deshacer.",
            [
                { text: "No, mantener", style: "cancel" },
                { text: reembolso ? "Cancelar y reembolsar" : "Sí, cancelar", style: "destructive", onPress: () => ejecutar("cancelar", cancelarCompra, reembolso ? "Compra cancelada. Se reembolsará el importe." : "Compra cancelada.") }
            ]
        )
    }

    const abrirChat = () => navigation.navigate("Chat", { compraId: c.id, titulo: c.evento?.nombre, contraparte })

    return (
        <Screen>
            <ScrollView
                contentContainerStyle={styles.scroll}
                refreshControl={<RefreshControl refreshing={refrescando} onRefresh={async () => { setRefrescando(true); await recargar(true); setRefrescando(false) }} colors={[colors.primary]} />}
            >
                <Banner mensaje={errorAccion} />

                {/* 1. Estado: lo primero que se quiere saber */}
                <View style={[styles.estadoCard, { backgroundColor: estado.bg }]} accessible accessibilityLabel={`Estado: ${estado.label}. ${dias ?? ""} ${estado.ayuda[rol]}`}>
                    <EstadoBadge estado={c.estado} grande />
                    {dias ? <Text variant="title" color={estado.fg}>{dias}</Text> : null}
                    <Text color={estado.fg}>{estado.ayuda[rol]}</Text>
                </View>

                {/* 2. Qué compraste */}
                <View style={styles.card}>
                    <Pressable onPress={() => navigation.navigate("EventoDetalle", { id: c.evento.id })} accessibilityRole="button" accessibilityLabel={`Ver evento ${c.evento?.nombre}`} style={styles.eventoLink}>
                        <View style={{ flex: 1 }}>
                            <Text variant="subtitle" header>{c.evento?.nombre}</Text>
                            <Text color={colors.textMuted}>{formatFechaHora(c.evento?.fecha)}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                    </Pressable>
                    <Fila etiqueta="Entrada" valor={c.tipoEntrada?.nombre} />
                    <Fila etiqueta="Precio unitario" valor={formatPrecio(c.tipoEntrada?.precioUnitario)} />
                    <Fila etiqueta="Cantidad" valor={String(c.cantidad)} />
                    <Fila etiqueta="Total" valor={formatPrecio(c.total)} fuerte />
                    {!esComprador && c.comprador ? <Fila etiqueta="Comprador" valor={`${c.comprador.nombre} ${c.comprador.apellido}`} /> : null}
                    <Fila etiqueta="Compra nº" valor={`#${c.id}`} />
                </View>

                {/* 3. Chat */}
                <Pressable onPress={abrirChat} accessibilityRole="button" accessibilityLabel={`Mensajes con ${contraparte}. ${plural(c.cantidadMensajes ?? 0, "mensaje", "mensajes")}`} style={styles.chat}>
                    <View style={styles.chatIcono}><Ionicons name="chatbubbles" size={24} color={colors.primary} /></View>
                    <View style={{ flex: 1 }}>
                        <Text variant="bodyBold">Chat con {contraparte}</Text>
                        <Text variant="caption" color={colors.textMuted}>
                            {c.cantidadMensajes ? plural(c.cantidadMensajes, "mensaje", "mensajes") : "Consultá dudas sobre el evento o el acceso"}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={22} color={colors.primary} />
                </Pressable>

                {/* 4. Seguimiento */}
                <View style={styles.card}>
                    <Text variant="subtitle" header>Seguimiento</Text>
                    {historial.loading ? <Text color={colors.textMuted}>Cargando historial…</Text>
                        : pasos.length === 0 ? <Text color={colors.textMuted}>Sin movimientos todavía.</Text>
                            : pasos.map((p, i) => {
                                const e = ESTADOS[p.estado]
                                const ultimo = i === pasos.length - 1
                                return (
                                    <View key={`${p.estado}-${p.fechaHora}-${i}`} style={styles.paso} accessible accessibilityLabel={`${e?.label}, ${formatMomento(p.fechaHora)}, ${p.realizadoPorElSistema ? "automático" : "por " + (p.quien?.nombre ?? "")}${ultimo ? ", estado actual" : ""}`}>
                                        <View style={styles.linea}>
                                            <View style={[styles.punto, { backgroundColor: ultimo ? colors.primary : colors.borderStrong }]} />
                                            {!ultimo && <View style={styles.tramo} />}
                                        </View>
                                        <View style={{ flex: 1, paddingBottom: ultimo ? 0 : spacing.md }}>
                                            <Text variant={ultimo ? "bodyBold" : "body"}>{e?.label ?? p.estado}{ultimo ? " (actual)" : ""}</Text>
                                            <Text variant="caption" color={colors.textMuted}>
                                                {formatMomento(p.fechaHora)} · {p.realizadoPorElSistema ? "Automático" : `Por ${p.quien?.nombre ?? "—"} ${p.quien?.apellido ?? ""}`}
                                            </Text>
                                        </View>
                                    </View>
                                )
                            })}
                </View>

                {/* 5. Acción destructiva: separada del llamado principal, con confirmación */}
                {puedeCancelar && (
                    <View style={{ gap: spacing.sm }}>
                        <Button title={c.estado === "CONFIRMADA" ? "Cancelar y pedir reembolso" : "Cancelar compra"} variant="danger" icon="close-circle-outline" onPress={cancelar} loading={accion === "cancelar"} disabled={!!accion} />
                    </View>
                )}
                {esComprador && eventoPasado && (c.estado === "PENDIENTE" || c.estado === "CONFIRMADA") && (
                    <Text variant="caption" color={colors.textMuted}>El evento ya se realizó: la compra ya no se puede cancelar ni pagar.</Text>
                )}
                {!esComprador && (
                    <Text variant="caption" color={colors.textMuted}>Los compradores pueden cancelar mientras la entrada no esté utilizada y el evento no se haya realizado.</Text>
                )}
            </ScrollView>

            {(puedePagar || puedeCalificar) && (
                <View style={styles.barra}>
                    {puedePagar && <Button title={`Confirmar pago · ${formatPrecio(c.total)}`} icon="card" onPress={pagar} loading={accion === "pagar"} disabled={!!accion} />}
                    {puedeCalificar && <Button title="Calificar el evento" icon="star" variant="accent" onPress={() => navigation.navigate("Calificar", { eventoId: c.evento.id, eventoNombre: c.evento.nombre })} />}
                </View>
            )}
        </Screen>
    )
}

function Fila({ etiqueta, valor, fuerte = false }) {
    return (
        <View style={styles.fila} accessible accessibilityLabel={`${etiqueta}: ${valor}`}>
            <Text color={colors.textMuted}>{etiqueta}</Text>
            <Text variant={fuerte ? "subtitle" : "bodyBold"}>{valor}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    scroll: { padding: spacing.lg, gap: spacing.lg },
    estadoCard: { padding: spacing.lg, borderRadius: radius.lg, gap: spacing.sm },
    card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth: 1, borderColor: colors.border },
    eventoLink: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: TOUCH, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.xs },
    fila: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.md },
    chat: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 2, borderColor: colors.primary, minHeight: TOUCH + 16 },
    chatIcono: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
    paso: { flexDirection: "row", gap: spacing.md },
    linea: { alignItems: "center", width: 16 },
    punto: { width: 14, height: 14, borderRadius: 7, marginTop: 4 },
    tramo: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
    barra: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border }
})
