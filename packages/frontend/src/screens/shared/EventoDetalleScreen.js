import React, { useLayoutEffect, useState } from "react"
import { Pressable, ScrollView, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import Button from "../../components/Button"
import { Estrellas, Reputacion } from "../../components/Puntaje"
import { ErrorState, LoadingView } from "../../components/States"
import { useToast } from "../../components/Toast"
import ComprarSheet from "./ComprarSheet"
import { obtenerEvento, reseniasDeEvento } from "../../api/eventos"
import { useAuth } from "../../context/AuthContext"
import { useFavoritos } from "../../context/FavoritosContext"
import useRequest from "../../hooks/useRequest"
import { colors, radius, spacing, TOUCH } from "../../theme"
import { formatFechaHora, formatPrecio, plural, yaPaso } from "../../utils/format"

export default function EventoDetalleScreen({ route, navigation }) {
    const { id } = route.params
    const { user, esComprador } = useAuth()
    const { esFavorito, alternar } = useFavoritos()
    const { mostrar } = useToast()
    const [comprando, setComprando] = useState(false)
    const [descripcionAbierta, setDescripcionAbierta] = useState(false)

    const evento = useRequest(() => obtenerEvento(id), [id])
    // Vista previa de reseñas (divulgación progresiva: 3 acá, "Ver todas" lleva al resto). Si falla, no bloquea la pantalla.
    const resenias = useRequest(() => reseniasDeEvento(id, { page: 1, limit: 3 }), [id])

    const e = evento.data
    const favorito = esFavorito(id)

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: esComprador && e ? () => (
                <Pressable
                    onPress={() => alternar(id)}
                    accessibilityRole="button"
                    accessibilityLabel={favorito ? "Quitar de favoritos" : "Guardar en favoritos"}
                    accessibilityState={{ selected: favorito }}
                    style={styles.headerBtn}
                >
                    <Ionicons name={favorito ? "heart" : "heart-outline"} size={26} color={colors.onPrimary} />
                </Pressable>
            ) : undefined
        })
    }, [navigation, esComprador, e, favorito, alternar, id])

    if (evento.loading) return <Screen><LoadingView mensaje="Cargando evento…" /></Screen>
    if (evento.error || !e) return <Screen><ErrorState error={evento.error} onReintentar={evento.reload} /></Screen>

    const realizado = yaPaso(e.fecha)
    const esMio = user?.id === e.organizador?.id
    const precios = (e.tiposEntrada ?? []).map((t) => t.precio)
    const desde = precios.length ? Math.min(...precios) : null
    const hayCupo = (e.tiposEntrada ?? []).some((t) => t.entradasDisponibles > 0)
    const descripcionLarga = (e.descripcion?.length ?? 0) > 160
    const meta = resenias.data?.meta
    const lista = resenias.data?.items ?? []
    const reputacion = e.organizadorReputacion ?? meta?.reputacion

    return (
        <Screen>
            <ScrollView contentContainerStyle={styles.scroll}>
                <View style={styles.cuerpo}>
                    {e.categoria?.nombre ? <Text variant="label" color={colors.primary}>{e.categoria.nombre.toUpperCase()}</Text> : null}
                    <Text variant="display" header>{e.nombre}</Text>

                    <View style={styles.fila}>
                        <Ionicons name="calendar" size={22} color={colors.primary} />
                        <Text variant="bodyBold">{formatFechaHora(e.fecha)}</Text>
                    </View>
                    {realizado ? (
                        <View style={styles.aviso} accessibilityRole="alert">
                            <Ionicons name="information-circle" size={20} color={colors.warningText} />
                            <Text color={colors.warningText} style={{ flex: 1 }}>Este evento ya se realizó. Ya no se pueden comprar entradas.</Text>
                        </View>
                    ) : null}

                    <View style={styles.bloque}>
                        <Text variant="subtitle" header>Acerca del evento</Text>
                        <Text numberOfLines={descripcionAbierta ? undefined : 4}>{e.descripcion}</Text>
                        {descripcionLarga && (
                            <Pressable onPress={() => setDescripcionAbierta((v) => !v)} accessibilityRole="button" style={styles.verMas}>
                                <Text variant="label" color={colors.primary}>{descripcionAbierta ? "Ver menos" : "Ver más"}</Text>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.bloque}>
                        <Text variant="subtitle" header>Organizador</Text>
                        <View style={styles.tarjeta}>
                            <View style={styles.avatar}><Ionicons name="person" size={24} color={colors.primary} /></View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text variant="bodyBold">{e.organizador?.nombre} {e.organizador?.apellido}</Text>
                                <Reputacion reputacion={reputacion} />
                            </View>
                        </View>
                    </View>

                    <View style={styles.bloque}>
                        <Text variant="subtitle" header>Entradas</Text>
                        {(e.tiposEntrada ?? []).map((t) => {
                            const agotado = t.entradasDisponibles <= 0
                            return (
                                <View key={t.id} style={styles.tipo} accessible accessibilityLabel={`${t.nombre}, ${formatPrecio(t.precio)}, ${agotado ? "agotada" : plural(t.entradasDisponibles, "disponible", "disponibles")}`}>
                                    <View style={{ flex: 1 }}>
                                        <Text variant="bodyBold">{t.nombre}</Text>
                                        {t.descripcion ? <Text variant="caption" color={colors.textMuted}>{t.descripcion}</Text> : null}
                                        <Text variant="caption" color={agotado ? colors.danger : colors.textMuted}>
                                            {agotado ? "Agotada" : `${t.entradasDisponibles} de ${t.cupo} disponibles`}
                                        </Text>
                                    </View>
                                    <Text variant="subtitle">{formatPrecio(t.precio)}</Text>
                                </View>
                            )
                        })}
                    </View>

                    <View style={styles.bloque}>
                        <Text variant="subtitle" header>Reseñas del organizador</Text>
                        {resenias.loading ? <Text color={colors.textMuted}>Cargando reseñas…</Text>
                            : lista.length === 0 ? <Text color={colors.textMuted}>Todavía no hay reseñas de este organizador.</Text>
                                : lista.map((r) => (
                                    <View key={r.id} style={styles.resenia}>
                                        <View style={styles.reseniaCab}>
                                            <Text variant="bodyBold" style={{ flex: 1 }} numberOfLines={1}>{r.comprador?.nombre} {r.comprador?.apellido}</Text>
                                            <Estrellas valor={r.puntuacion} />
                                        </View>
                                        <Text>{r.detalle}</Text>
                                        {r.evento?.nombre ? <Text variant="caption" color={colors.textMuted}>Sobre: {r.evento.nombre}</Text> : null}
                                    </View>
                                ))}
                        {lista.length > 0 && (
                            <Button title="Ver todas las reseñas" variant="secondary" onPress={() => navigation.navigate("Resenias", { eventoId: id })} />
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Barra de acción fija: el llamado principal siempre al alcance del pulgar. */}
            <View style={styles.barra}>
                <View style={{ flex: 1 }}>
                    {desde !== null && <Text variant="caption" color={colors.textMuted}>Desde</Text>}
                    <Text variant="title">{desde !== null ? formatPrecio(desde) : "—"}</Text>
                </View>
                {esComprador ? (
                    <Button
                        title={realizado ? "Evento realizado" : hayCupo ? "Comprar entradas" : "Agotado"}
                        icon="ticket" disabled={realizado || !hayCupo} fullWidth={false} style={styles.cta}
                        onPress={() => setComprando(true)}
                    />
                ) : esMio ? (
                    <Button title="Ver compras" icon="receipt-outline" fullWidth={false} style={styles.cta} onPress={() => navigation.navigate("EventoCompras", { id, nombre: e.nombre })} />
                ) : null}
            </View>

            <ComprarSheet
                visible={comprando}
                evento={e}
                onClose={() => setComprando(false)}
                onCupoCambiado={() => evento.reload({ silent: true })}
                onComprada={(compra) => {
                    setComprando(false)
                    mostrar("Reservaste tus entradas. Confirmá el pago para asegurarlas.")
                    navigation.replace("CompraDetalle", { id: compra.id })
                }}
            />
        </Screen>
    )
}

const styles = StyleSheet.create({
    scroll: { paddingBottom: spacing.xl },
    cuerpo: { padding: spacing.lg, gap: spacing.lg },
    fila: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    aviso: { flexDirection: "row", gap: spacing.sm, backgroundColor: colors.warningTint, padding: spacing.md, borderRadius: radius.md },
    bloque: { gap: spacing.sm },
    verMas: { minHeight: TOUCH, justifyContent: "center", alignSelf: "flex-start" },
    tarjeta: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryTint, alignItems: "center", justifyContent: "center" },
    tipo: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    resenia: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, gap: spacing.xs },
    reseniaCab: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    barra: { flexDirection: "row", alignItems: "center", gap: spacing.lg, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    cta: { minWidth: 180 },
    headerBtn: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" }
})
