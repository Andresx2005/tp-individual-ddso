import React, { useEffect, useMemo, useRef, useState } from "react"
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from "react-native"
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker"
import { Ionicons } from "@expo/vector-icons"
import { useHeaderHeight } from "@react-navigation/elements"
import Screen from "../../components/Screen"
import Text from "../../components/Text"
import Button from "../../components/Button"
import TextField from "../../components/TextField"
import CategoriaSelect, { normalizar } from "../../components/CategoriaSelect"
import { Banner } from "../../components/States"
import { useToast } from "../../components/Toast"
import { crearEvento, listarCategorias } from "../../api/eventos"
import useRequest from "../../hooks/useRequest"
import { colors, radius, spacing, TOUCH } from "../../theme"
import { aIsoConZona, formatFechaHora, formatPrecio, parseNumero, plural } from "../../utils/format"
import { erroresPorCampo, mensajeDeError } from "../../utils/errors"

// Crear un evento tiene muchos datos: se divide en 4 pasos cortos (divulgación progresiva) con
// progreso visible, validación por paso, y una revisión final antes de publicar (reconocer en vez de recordar).
const PASOS = ["Datos", "Fecha", "Entradas", "Revisar"]
const SUGERENCIAS = ["General", "Platea", "Platea alta", "Platea baja", "Campo", "Campo VIP", "Palco", "VIP", "Early bird", "Preventa"]
let contador = 0
const nuevoTipo = () => ({ key: ++contador, nombre: "", descripcion: "", precio: "", cupo: "" })
const fechaInicial = () => { const d = new Date(); d.setDate(d.getDate() + 30); d.setHours(21, 0, 0, 0); return d }

export default function CrearEventoScreen({ navigation }) {
    const { mostrar } = useToast()
    const altoHeader = useHeaderHeight()
    const scrollRef = useRef(null)
    const categorias = useRequest(listarCategorias, [])

    const [paso, setPaso] = useState(0)
    const [nombre, setNombre] = useState("")
    const [descripcion, setDescripcion] = useState("")
    const [categoria, setCategoria] = useState("") // texto: una existente elegida del menú o una nueva escrita a mano
    const [catDescripcion, setCatDescripcion] = useState("")
    const [fecha, setFecha] = useState(fechaInicial)
    const [tipos, setTipos] = useState(() => [nuevoTipo()])
    const [errores, setErrores] = useState({})
    const [errorGeneral, setErrorGeneral] = useState(null)
    const [publicando, setPublicando] = useState(false)
    const enviado = useRef(false)

    const sucio = !!(nombre || descripcion || categoria || tipos.some((t) => t.nombre || t.precio || t.cupo))

    // Prevención de errores: avisar antes de perder un formulario a medio completar.
    useEffect(() => {
        return navigation.addListener("beforeRemove", (e) => {
            if (enviado.current || !sucio) return
            e.preventDefault()
            Alert.alert("¿Descartar el evento?", "Perdés los datos que cargaste hasta ahora.", [
                { text: "Seguir editando", style: "cancel" },
                { text: "Descartar", style: "destructive", onPress: () => navigation.dispatch(e.data.action) }
            ])
        })
    }, [navigation, sucio])

    const nombresCategorias = useMemo(() => (categorias.data ?? []).map((c) => c.nombre), [categorias.data])
    const categoriaExiste = nombresCategorias.some((n) => normalizar(n) === normalizar(categoria))
    // Si ya existe, el backend la reutiliza (y ignora la descripción); si no, la crea.
    const categoriaElegida = categoria.trim()
        ? { nombre: categoria.trim(), ...(!categoriaExiste && catDescripcion.trim() ? { descripcion: catDescripcion.trim() } : {}) }
        : null

    const setTipo = (key, campo, valor) => setTipos((ts) => ts.map((t) => (t.key === key ? { ...t, [campo]: valor } : t)))

    function validar(p) {
        const e = {}
        if (p === 0) {
            if (nombre.trim().length < 3) e.nombre = "El nombre debe tener al menos 3 caracteres"
            if (!descripcion.trim()) e.descripcion = "Contá de qué se trata el evento"
            if (categoria.trim().length < 3) e.categoria = "Elegí una categoría de la lista o escribí una nueva (mínimo 3 caracteres)"
        }
        if (p === 1) {
            if (fecha.getTime() < Date.now() + 60 * 1000) e.fecha = "La fecha y hora deben ser futuras"
        }
        if (p === 2) {
            tipos.forEach((t, i) => {
                if (!t.nombre.trim()) e[`tipo.${i}.nombre`] = "Ponele un nombre (ej.: General)"
                const precio = parseNumero(t.precio)
                if (Number.isNaN(precio) || precio < 0) e[`tipo.${i}.precio`] = "Ingresá un precio (0 si es gratuita)"
                const cupo = parseNumero(t.cupo)
                if (Number.isNaN(cupo) || !Number.isInteger(cupo) || cupo < 1) e[`tipo.${i}.cupo`] = "Ingresá un cupo entero de 1 o más"
            })
            const nombres = tipos.map((t) => t.nombre.trim().toLowerCase()).filter(Boolean)
            if (new Set(nombres).size !== nombres.length) e.tipos = "No repitas el nombre de los tipos de entrada"
        }
        return e
    }

    function siguiente() {
        const e = validar(paso)
        setErrores(e)
        if (Object.keys(e).length) return
        setPaso((p) => p + 1)
        scrollRef.current?.scrollTo({ y: 0, animated: false })
    }

    function atras() {
        setErrores({})
        if (paso === 0) return navigation.goBack()
        setPaso((p) => p - 1)
        scrollRef.current?.scrollTo({ y: 0, animated: false })
    }

    async function publicar() {
        const todos = { ...validar(0), ...validar(1), ...validar(2) }
        if (Object.keys(todos).length) {
            setErrores(todos)
            const primero = [validar(0), validar(1), validar(2)].findIndex((x) => Object.keys(x).length)
            return setPaso(primero) // lleva al paso con el problema
        }
        setPublicando(true)
        setErrorGeneral(null)
        try {
            const creado = await crearEvento({
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                categoria: categoriaElegida,
                fecha: aIsoConZona(fecha),
                tiposEntrada: tipos.map((t) => ({
                    nombre: t.nombre.trim(),
                    ...(t.descripcion.trim() ? { descripcion: t.descripcion.trim() } : {}),
                    precio: parseNumero(t.precio),
                    cupo: parseNumero(t.cupo)
                }))
            })
            enviado.current = true
            mostrar("¡Evento publicado!")
            navigation.replace("EventoCompras", { id: creado.id, nombre: creado.nombre })
        } catch (e) {
            const detalles = erroresPorCampo(e)
            const lineas = Object.entries(detalles).map(([campo, msg]) => `• ${campo}: ${msg}`).join("\n")
            setErrorGeneral(`${mensajeDeError(e)}${lineas ? "\n" + lineas : ""}`)
            setPublicando(false)
        }
    }

    // ---- selector de fecha/hora (nativo en cada plataforma) ----
    const cambiarAndroid = (modo) => DateTimePickerAndroid.open({
        value: fecha, mode: modo, is24Hour: true, minimumDate: modo === "date" ? new Date() : undefined,
        onChange: (ev, elegido) => {
            if (ev.type !== "set" || !elegido) return
            const n = new Date(fecha)
            if (modo === "date") n.setFullYear(elegido.getFullYear(), elegido.getMonth(), elegido.getDate())
            else n.setHours(elegido.getHours(), elegido.getMinutes(), 0, 0)
            setFecha(n)
        }
    })

    const ultimo = paso === PASOS.length - 1

    return (
        <Screen>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={altoHeader}>
                {/* Progreso: texto + barra (no sólo color) */}
                <View style={styles.progreso} accessible accessibilityLabel={`Paso ${paso + 1} de ${PASOS.length}: ${PASOS[paso]}`}>
                    <Text variant="label" color={colors.textMuted}>Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}</Text>
                    <View style={styles.pasos}>
                        {PASOS.map((p, i) => <View key={p} style={[styles.tramo, i <= paso && styles.tramoActivo]} />)}
                    </View>
                </View>

                <ScrollView ref={scrollRef} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                    <Banner mensaje={errorGeneral} />

                    {paso === 0 && (
                        <>
                            <Text variant="title" header>Contanos del evento</Text>
                            <TextField label="Nombre del evento" value={nombre} onChangeText={setNombre} error={errores.nombre} maxLength={120} />
                            <TextField label="Descripción" value={descripcion} onChangeText={setDescripcion} error={errores.descripcion} multiline maxLength={5000} showCounter hint="Qué van a vivir los asistentes, línea de artistas, acceso, etc." />
                            <CategoriaSelect
                                label="Categoría"
                                value={categoria}
                                onChangeText={setCategoria}
                                opciones={nombresCategorias}
                                cargando={categorias.loading}
                                error={errores.categoria}
                                hint={categorias.error ? "No pudimos cargar las categorías existentes; podés escribir una." : "Elegí una de la lista o escribí una nueva."}
                            />
                            {/* La descripción sólo se pide si la categoría es nueva (si ya existe, el backend la ignora) */}
                            {categoria.trim().length >= 3 && !categoriaExiste && !categorias.loading && (
                                <View style={styles.subform}>
                                    <TextField label="Descripción de la categoría" optional value={catDescripcion} onChangeText={setCatDescripcion} maxLength={300} />
                                </View>
                            )}
                        </>
                    )}

                    {paso === 1 && (
                        <>
                            <Text variant="title" header>¿Cuándo es?</Text>
                            <View style={styles.fechaCard} accessible accessibilityLabel={`Fecha elegida: ${formatFechaHora(fecha.toISOString())}`}>
                                <Ionicons name="calendar" size={28} color={colors.primary} />
                                <Text variant="subtitle">{formatFechaHora(fecha.toISOString())}</Text>
                            </View>
                            {Platform.OS === "android" ? (
                                <View style={{ gap: spacing.sm }}>
                                    <Button title="Cambiar fecha" icon="calendar-outline" variant="secondary" onPress={() => cambiarAndroid("date")} />
                                    <Button title="Cambiar hora" icon="time-outline" variant="secondary" onPress={() => cambiarAndroid("time")} />
                                </View>
                            ) : (
                                <DateTimePicker value={fecha} mode="datetime" display="inline" minimumDate={new Date()} locale="es-AR" onChange={(_, d) => d && setFecha(d)} accentColor={colors.primary} />
                            )}
                            {errores.fecha ? <MensajeError texto={errores.fecha} /> : null}
                            <Text variant="caption" color={colors.textMuted}>Se usa la hora de tu dispositivo. Los compradores ya no podrán comprar ni cancelar cuando llegue esa fecha.</Text>
                        </>
                    )}

                    {paso === 2 && (
                        <>
                            <Text variant="title" header>Tipos de entrada</Text>
                            <Text color={colors.textMuted}>Cada tipo tiene su propio precio y cupo (por ejemplo General, Platea o VIP).</Text>
                            {errores.tipos ? <MensajeError texto={errores.tipos} /> : null}
                            {tipos.map((t, i) => (
                                <View key={t.key} style={styles.tipo}>
                                    <View style={styles.tipoCab}>
                                        <Text variant="subtitle" header>Entrada {i + 1}</Text>
                                        {tipos.length > 1 && (
                                            <Pressable onPress={() => setTipos((ts) => ts.filter((x) => x.key !== t.key))} accessibilityRole="button" accessibilityLabel={`Quitar entrada ${i + 1}`} style={styles.quitar}>
                                                <Ionicons name="trash-outline" size={22} color={colors.danger} />
                                            </Pressable>
                                        )}
                                    </View>
                                    {/* Menú con escritura libre. Se excluyen los nombres ya usados en las otras entradas (no pueden repetirse). */}
                                    <CategoriaSelect
                                        label="Nombre"
                                        value={t.nombre}
                                        onChangeText={(v) => setTipo(t.key, "nombre", v)}
                                        opciones={SUGERENCIAS.filter((s) => !tipos.some((o) => o.key !== t.key && normalizar(o.nombre) === normalizar(s)))}
                                        error={errores[`tipo.${i}.nombre`]}
                                        placeholder="Elegí o escribí un nombre"
                                        ayuda="Escribí el nombre de la entrada o abrí la lista de sugerencias con el botón siguiente"
                                        nombreLista="tipos de entrada sugeridos"
                                        vacio="No quedan sugerencias sin usar. Escribí un nombre."
                                        mensajeNuevo={null}
                                        hint="Elegí una sugerencia o escribí otro nombre."
                                        maxLength={60}
                                    />
                                    <TextField label="Descripción" optional value={t.descripcion} onChangeText={(v) => setTipo(t.key, "descripcion", v)} maxLength={300} />
                                    <View style={styles.dos}>
                                        <TextField style={{ flex: 1 }} label="Precio ($)" value={t.precio} onChangeText={(v) => setTipo(t.key, "precio", v)} error={errores[`tipo.${i}.precio`]} keyboardType="decimal-pad" />
                                        <TextField style={{ flex: 1 }} label="Cupo" value={t.cupo} onChangeText={(v) => setTipo(t.key, "cupo", v.replace(/\D/g, ""))} error={errores[`tipo.${i}.cupo`]} keyboardType="number-pad" hint="Entradas a la venta" />
                                    </View>
                                </View>
                            ))}
                            {tipos.length < 20 && <Button title="Agregar otro tipo de entrada" icon="add-circle-outline" variant="secondary" onPress={() => setTipos((ts) => [...ts, nuevoTipo()])} />}
                        </>
                    )}

                    {paso === 3 && (
                        <>
                            <Text variant="title" header>Revisá y publicá</Text>
                            <View style={styles.resumen}>
                                <Resumen titulo="Evento" onEditar={() => setPaso(0)}>
                                    <Text variant="bodyBold">{nombre.trim()}</Text>
                                    <Text numberOfLines={3} color={colors.textMuted}>{descripcion.trim()}</Text>
                                    <Text variant="caption" color={colors.primary}>Categoría: {categoriaElegida?.nombre}</Text>
                                </Resumen>
                                <Resumen titulo="Fecha" onEditar={() => setPaso(1)}>
                                    <Text variant="bodyBold">{formatFechaHora(fecha.toISOString())}</Text>
                                </Resumen>
                                <Resumen titulo={`Entradas (${tipos.length})`} onEditar={() => setPaso(2)}>
                                    {tipos.map((t) => (
                                        <Text key={t.key}>{t.nombre.trim()} · {formatPrecio(parseNumero(t.precio))} · {plural(parseNumero(t.cupo), "lugar", "lugares")}</Text>
                                    ))}
                                </Resumen>
                            </View>
                        </>
                    )}
                </ScrollView>

                <View style={styles.pie}>
                    <Button title={paso === 0 ? "Cancelar" : "Atrás"} variant="secondary" onPress={atras} style={styles.pieBtn} disabled={publicando} />
                    <Button
                        title={ultimo ? "Publicar evento" : "Siguiente"} icon={ultimo ? "checkmark" : "arrow-forward"}
                        onPress={ultimo ? publicar : siguiente} loading={publicando} style={styles.pieBtnGrande}
                    />
                </View>
            </KeyboardAvoidingView>
        </Screen>
    )
}

function MensajeError({ texto }) {
    return (
        <View style={styles.error} accessibilityLiveRegion="polite">
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text variant="caption" color={colors.danger} style={{ flex: 1 }}>{texto}</Text>
        </View>
    )
}

function Resumen({ titulo, onEditar, children }) {
    return (
        <View style={styles.bloque}>
            <View style={styles.bloqueCab}>
                <Text variant="label" color={colors.textMuted}>{titulo.toUpperCase()}</Text>
                <Pressable onPress={onEditar} accessibilityRole="button" accessibilityLabel={`Editar ${titulo}`} style={styles.editar}>
                    <Text variant="label" color={colors.primary}>Editar</Text>
                </Pressable>
            </View>
            {children}
        </View>
    )
}

const styles = StyleSheet.create({
    progreso: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
    pasos: { flexDirection: "row", gap: spacing.xs },
    tramo: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
    tramoActivo: { backgroundColor: colors.primary },
    scroll: { padding: spacing.xl, gap: spacing.lg },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    subform: { gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.primaryTint },
    fechaCard: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primaryTint },
    tipo: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    tipoCab: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    quitar: { width: TOUCH, height: TOUCH, alignItems: "center", justifyContent: "center" },
    dos: { flexDirection: "row", gap: spacing.md },
    error: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
    resumen: { gap: spacing.md },
    bloque: { gap: spacing.xs, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    bloqueCab: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    editar: { minHeight: TOUCH, minWidth: TOUCH, alignItems: "flex-end", justifyContent: "center" },
    pie: { flexDirection: "row", gap: spacing.md, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
    pieBtn: { flex: 1 },
    pieBtnGrande: { flex: 2 }
})
