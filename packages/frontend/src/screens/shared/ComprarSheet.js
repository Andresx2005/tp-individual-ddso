import React, { useEffect, useState } from "react"
import { Pressable, StyleSheet, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import BottomSheet from "../../components/BottomSheet"
import Text from "../../components/Text"
import Button from "../../components/Button"
import Stepper from "../../components/Stepper"
import { Banner } from "../../components/States"
import { comprar } from "../../api/compras"
import { colors, radius, spacing, TOUCH } from "../../theme"
import { formatPrecio, plural } from "../../utils/format"
import { mensajeDeError } from "../../utils/errors"

// Compra en 2 decisiones: tipo de entrada y cantidad. El total se actualiza en vivo y la cantidad
// nunca supera el cupo disponible (prevención de errores: se evita el error en lugar de mostrarlo después).
export default function ComprarSheet({ visible, onClose, evento, onComprada, onCupoCambiado }) {
    const tipos = evento?.tiposEntrada ?? []
    const [tipoId, setTipoId] = useState(null)
    const [cantidad, setCantidad] = useState(1)
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!visible) return
        const primero = tipos.find((t) => t.entradasDisponibles > 0)
        setTipoId((actual) => (tipos.some((t) => t.id === actual && t.entradasDisponibles > 0) ? actual : primero?.id ?? null))
        setCantidad(1)
        setError(null)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible])

    const tipo = tipos.find((t) => t.id === tipoId)
    const maximo = tipo?.entradasDisponibles ?? 1
    const total = tipo ? tipo.precio * cantidad : 0

    function elegir(t) {
        setTipoId(t.id)
        setCantidad((c) => Math.min(c, t.entradasDisponibles))
        setError(null)
    }

    async function confirmar() {
        setCargando(true)
        setError(null)
        try {
            const compra = await comprar({ eventoId: evento.id, tipoEntradaId: tipoId, cantidad })
            onComprada(compra)
        } catch (e) {
            setError(mensajeDeError(e))
            if (e.status === 409) onCupoCambiado?.() // el cupo cambió mientras decidías: refrescamos el evento
        } finally {
            setCargando(false)
        }
    }

    return (
        <BottomSheet
            visible={visible}
            onClose={onClose}
            title="Comprar entradas"
            footer={
                <>
                    <View style={styles.total} accessibilityLiveRegion="polite">
                        <Text color={colors.textMuted}>Total ({plural(cantidad, "entrada", "entradas")})</Text>
                        <Text variant="title">{formatPrecio(total)}</Text>
                    </View>
                    <Button title="Reservar entradas" icon="ticket" onPress={confirmar} loading={cargando} disabled={!tipo} />
                    <Text variant="caption" color={colors.textMuted} style={{ textAlign: "center" }}>
                        La compra queda pendiente hasta que confirmes el pago. Podés cancelarla cuando quieras antes del evento.
                    </Text>
                </>
            }
        >
            <Banner mensaje={error} />
            <Text variant="subtitle" header>1. Elegí el tipo de entrada</Text>
            <View style={{ gap: spacing.sm }} accessibilityRole="radiogroup">
                {tipos.map((t) => {
                    const agotado = t.entradasDisponibles <= 0
                    const activo = t.id === tipoId
                    return (
                        <Pressable
                            key={t.id}
                            disabled={agotado}
                            onPress={() => elegir(t)}
                            accessibilityRole="radio"
                            accessibilityState={{ checked: activo, disabled: agotado }}
                            accessibilityLabel={`${t.nombre}, ${formatPrecio(t.precio)}, ${agotado ? "agotada" : plural(t.entradasDisponibles, "disponible", "disponibles")}`}
                            style={[styles.tipo, activo && styles.tipoActivo, agotado && { opacity: 0.55 }]}
                        >
                            <Ionicons name={activo ? "radio-button-on" : "radio-button-off"} size={24} color={activo ? colors.primary : colors.borderStrong} />
                            <View style={{ flex: 1 }}>
                                <Text variant="bodyBold">{t.nombre}</Text>
                                {t.descripcion ? <Text variant="caption" color={colors.textMuted}>{t.descripcion}</Text> : null}
                                <Text variant="caption" color={agotado ? colors.danger : colors.textMuted}>
                                    {agotado ? "Agotada" : t.entradasDisponibles <= 10 ? `¡Últimas ${t.entradasDisponibles}!` : `${t.entradasDisponibles} disponibles`}
                                </Text>
                            </View>
                            <Text variant="bodyBold">{formatPrecio(t.precio)}</Text>
                        </Pressable>
                    )
                })}
            </View>

            <Text variant="subtitle" header>2. ¿Cuántas entradas?</Text>
            <View style={styles.cantidad}>
                <Stepper value={cantidad} min={1} max={maximo} onChange={setCantidad} label="Cantidad de entradas" />
                {tipo ? <Text variant="caption" color={colors.textMuted}>Máximo: {maximo}</Text> : null}
            </View>
        </BottomSheet>
    )
}

const styles = StyleSheet.create({
    tipo: { flexDirection: "row", alignItems: "center", gap: spacing.md, minHeight: TOUCH + 16, padding: spacing.md, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, backgroundColor: colors.surface },
    tipoActivo: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
    cantidad: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    total: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }
})
