import { useMemo } from "react"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { colors, fonts } from "../theme"

const ALTO_CONTENIDO = 64 // ícono + etiqueta, sin contar la barra del sistema

// Barra de pestañas inferior (patrón principal en móvil: alcance con el pulgar).
// - Suma el inset inferior del sistema (botones atrás / inicio / recientes o la barra de gestos) a la altura y al relleno,
//   para que la barra quede ENTERA por encima y los botones sean tocables sin pisar los del teléfono.
// - Etiqueta de texto siempre visible debajo del ícono (el ícono solo no alcanza para entender la sección).
export function useTabScreenOptions() {
    const insets = useSafeAreaInsets()
    return useMemo(() => ({
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
        tabBarShowLabel: true,
        tabBarLabelPosition: "below-icon",
        tabBarActiveTintColor: colors.primaryDark,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarActiveBackgroundColor: colors.primaryTint,
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 16 },
        tabBarItemStyle: { borderRadius: 12, marginHorizontal: 4, marginVertical: 4 },
        tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.borderStrong,
            borderTopWidth: 1,
            height: ALTO_CONTENIDO + insets.bottom,
            paddingTop: 4,
            paddingBottom: insets.bottom + 4
        },
        tabBarAllowFontScaling: true
    }), [insets.bottom])
}

// Etiqueta que anuncia el lector de pantalla: qué sección es y qué se puede hacer ahí.
// (React Navigation ya agrega "pestaña, 1 de 4" y el estado seleccionado.)
export const etiquetaTab = (texto) => ({ tabBarAccessibilityLabel: texto })
