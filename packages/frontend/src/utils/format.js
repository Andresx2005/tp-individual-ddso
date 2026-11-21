// Formateo en español rioplatense sin depender de Intl (soporte irregular en Hermes/Android).
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]
const pad = (n) => String(n).padStart(2, "0")

export function formatPrecio(valor) {
    if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return "—"
    const n = Number(valor)
    if (n === 0) return "Gratis"
    const [entera, decimal] = Math.abs(n).toFixed(2).split(".")
    const miles = entera.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    return `${n < 0 ? "-" : ""}$ ${miles}${decimal !== "00" ? "," + decimal : ""}`
}

export function formatPuntaje(n) {
    return Number(n).toFixed(1).replace(".", ",")
}

export function formatHora(iso) {
    const d = new Date(iso)
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatFecha(iso) {
    const d = new Date(iso)
    return `${DIAS[d.getDay()]} ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function formatFechaHora(iso) {
    return `${formatFecha(iso)} · ${formatHora(iso)} h`
}

// Para mensajes de chat: hora si es de hoy; si no, día y mes.
export function formatMomento(iso) {
    const d = new Date(iso)
    const hoy = new Date()
    const mismoDia = d.toDateString() === hoy.toDateString()
    return mismoDia ? formatHora(iso) : `${d.getDate()} ${MESES[d.getMonth()]} · ${formatHora(iso)}`
}

export const plural = (n, singular, pluralTxt) => `${n} ${n === 1 ? singular : pluralTxt}`

export function textoDias(dias) {
    if (dias === null || dias === undefined) return null
    if (dias < 0) return "El evento ya pasó"
    if (dias === 0) return "¡Es hoy!"
    if (dias === 1) return "Es mañana"
    return `Faltan ${dias} días`
}

export const yaPaso = (iso) => new Date(iso).getTime() < Date.now()

// ISO 8601 con la zona horaria local (ej.: 2027-03-20T21:00:00-03:00), como pide el backend.
export function aIsoConZona(fecha) {
    const off = -fecha.getTimezoneOffset()
    const signo = off >= 0 ? "+" : "-"
    const abs = Math.abs(off)
    return (
        `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}` +
        `T${pad(fecha.getHours())}:${pad(fecha.getMinutes())}:00${signo}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
    )
}

// "25000" o "25.000,50" o "25000.5" -> número (o NaN)
export function parseNumero(texto) {
    const t = String(texto ?? "").trim()
    if (!t) return NaN
    const limpio = t.includes(",") ? t.replace(/\./g, "").replace(",", ".") : t
    return Number(limpio)
}
