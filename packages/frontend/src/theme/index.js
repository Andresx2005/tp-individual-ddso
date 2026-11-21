import { Platform } from "react-native"

// Regla 60-30-10
//  60 % -> neutros claros (fondos y superficies): descansan la vista y dejan respirar el contenido
//  30 % -> verde de marca (headers, tab activa, botones primarios, chips activos)
//  10 % -> acento ámbar (sólo precios destacados, favorito activo y llamados puntuales)
// Todos los pares texto/fondo cumplen WCAG AA (>= 4.5:1), verificados con script.
export const colors = {
    // 60 %
    bg: "#F6F8F5",
    surface: "#FFFFFF",
    border: "#D9E1D9",
    borderStrong: "#6B7A70", // bordes de inputs (>= 3:1 contra la superficie)
    text: "#14201A",
    textMuted: "#4A5A50",
    // 30 %
    primary: "#16714A",
    primaryDark: "#0F5435",
    primaryTint: "#E3F2E9",
    onPrimary: "#FFFFFF",
    // 10 %
    accent: "#F2A900",
    onAccent: "#1F1500",
    // feedback
    danger: "#B3261E",
    dangerDark: "#8C1D18",
    dangerTint: "#FCE8E6",
    warningTint: "#FFF1D0",
    warningText: "#6B4200",
    overlay: "rgba(10, 20, 14, 0.55)"
}

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }
export const radius = { sm: 8, md: 12, lg: 16, pill: 999 }
export const TOUCH = 48 // tamaño mínimo de objetivo táctil (Material / WCAG 2.5.5)

// Tipografía: Atkinson Hyperlegible (Braille Institute). Diseñada para maximizar la legibilidad
// (caracteres inconfundibles: I/l/1, O/0) y pensada para baja visión. Un solo family, dos pesos.
export const fonts = { regular: "AtkinsonHyperlegible_400Regular", bold: "AtkinsonHyperlegible_700Bold" }

export const type = {
    display: { fontFamily: fonts.bold, fontSize: 28, lineHeight: 36 },
    title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 30 },
    subtitle: { fontFamily: fonts.bold, fontSize: 18, lineHeight: 26 },
    body: { fontFamily: fonts.regular, fontSize: 16, lineHeight: 24 },
    bodyBold: { fontFamily: fonts.bold, fontSize: 16, lineHeight: 24 },
    caption: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 }, // 14 px es el mínimo usado en toda la app
    label: { fontFamily: fonts.bold, fontSize: 14, lineHeight: 20 }
}

export const shadow = Platform.select({
    ios: { shadowColor: "#0A140E", shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } },
    android: { elevation: 2 },
    default: {}
})
