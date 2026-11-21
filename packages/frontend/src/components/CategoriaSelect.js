import React, { useMemo, useState } from "react"
import { Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import Text from "./Text"
import { colors, fonts, radius, spacing, TOUCH } from "../theme"

export const normalizar = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim()

// Menú desplegable con escritura libre (combobox):
//  - el botón de la derecha despliega TODAS las categorías existentes;
//  - al escribir, la lista se filtra por lo tecleado;
//  - si lo escrito no coincide con ninguna, se usa como categoría nueva.
// No muestra las categorías como botones sueltos: ocupan una sola fila hasta que se las pide (divulgación progresiva).
export default function CategoriaSelect({
    label, value, onChangeText, opciones = [], cargando = false, error, hint, maxLength = 60,
    placeholder = "Elegí o escribí una categoría",
    ayuda = "Escribí una categoría o abrí la lista con el botón siguiente",
    nombreLista = "categorías", // "Mostrar lista de <nombreLista>"
    vacio = "Todavía no hay categorías creadas.",
    mensajeNuevo = (v) => `Se va a crear la categoría nueva “${v}”.`, // null para no mostrar aviso
    minNuevo = 3
}) {
    const [abierto, setAbierto] = useState(false)
    const [filtrar, setFiltrar] = useState(false) // true sólo mientras se escribe

    const visibles = useMemo(() => {
        const q = normalizar(value)
        return filtrar && q ? opciones.filter((o) => normalizar(o).includes(q)) : opciones
    }, [opciones, value, filtrar])

    const existe = opciones.some((o) => normalizar(o) === normalizar(value))

    const alternar = () => { setFiltrar(false); setAbierto((a) => !a) }
    const elegir = (nombre) => { onChangeText(nombre); setFiltrar(false); setAbierto(false) }
    const escribir = (texto) => { onChangeText(texto); setFiltrar(true); setAbierto(true) }

    return (
        <View style={styles.wrap}>
            <Text variant="label">{label}</Text>
            <View style={[styles.box, abierto && styles.boxAbierto, !!error && styles.boxError]}>
                <TextInput
                    value={value}
                    onChangeText={escribir}
                    onSubmitEditing={() => setAbierto(false)}
                    maxLength={maxLength}
                    placeholder={cargando ? "Cargando…" : placeholder}
                    placeholderTextColor={colors.textMuted}
                    accessibilityLabel={label}
                    accessibilityHint={ayuda}
                    accessibilityState={{ expanded: abierto }}
                    maxFontSizeMultiplier={1.6}
                    returnKeyType="done"
                    style={styles.input}
                />
                <Pressable
                    onPress={alternar}
                    accessibilityRole="button"
                    accessibilityLabel={abierto ? `Ocultar lista de ${nombreLista}` : `Mostrar lista de ${nombreLista}`}
                    accessibilityState={{ expanded: abierto }}
                    style={styles.flecha}
                >
                    <Ionicons name={abierto ? "chevron-up" : "chevron-down"} size={24} color={colors.primary} />
                </Pressable>
            </View>

            {abierto && (
                <View style={styles.lista} accessibilityLabel={`Opciones de ${nombreLista}`}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={{ maxHeight: 240 }}>
                        {visibles.map((o) => {
                            const activa = normalizar(o) === normalizar(value)
                            return (
                                <Pressable
                                    key={o}
                                    onPress={() => elegir(o)}
                                    accessibilityRole="menuitem"
                                    accessibilityState={{ selected: activa }}
                                    accessibilityLabel={activa ? `${o}, seleccionada` : o}
                                    style={[styles.item, activa && styles.itemActivo]}
                                >
                                    <Text variant={activa ? "bodyBold" : "body"} style={{ flex: 1 }}>{o}</Text>
                                    {activa && <Ionicons name="checkmark" size={22} color={colors.primary} />}
                                </Pressable>
                            )
                        })}
                        {visibles.length === 0 && (
                            <View style={styles.item} accessibilityLiveRegion="polite">
                                <Text color={colors.textMuted} style={{ flex: 1 }}>
                                    {opciones.length === 0 ? vacio : "Ninguna coincide con lo que escribiste."}
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}

            <View accessibilityLiveRegion="polite">
                {error ? (
                    <View style={styles.fila}>
                        <Ionicons name="alert-circle" size={16} color={colors.danger} />
                        <Text variant="caption" color={colors.danger} style={{ flex: 1 }}>{error}</Text>
                    </View>
                ) : mensajeNuevo && value.trim().length >= minNuevo && !existe && !cargando ? (
                    <View style={styles.fila}>
                        <Ionicons name="add-circle-outline" size={16} color={colors.primaryDark} />
                        <Text variant="caption" color={colors.primaryDark} style={{ flex: 1 }}>{mensajeNuevo(value.trim())}</Text>
                    </View>
                ) : hint ? <Text variant="caption" color={colors.textMuted}>{hint}</Text> : null}
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    wrap: { gap: spacing.xs },
    box: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderStrong, minHeight: TOUCH + 4 },
    boxAbierto: { borderColor: colors.primary, borderWidth: 2.5 },
    boxError: { borderColor: colors.danger, borderWidth: 2 },
    input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: colors.text, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    flecha: { width: TOUCH + 4, height: TOUCH + 4, alignItems: "center", justifyContent: "center", borderLeftWidth: 1, borderLeftColor: colors.border },
    lista: { backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.primary, overflow: "hidden" },
    item: { minHeight: TOUCH, flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    itemActivo: { backgroundColor: colors.primaryTint },
    fila: { flexDirection: "row", alignItems: "center", gap: spacing.xs }
})
