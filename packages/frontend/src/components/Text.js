import React from "react"
import { Text as RNText } from "react-native"
import { colors, type } from "../theme"

// Todo el texto de la app pasa por acá: tipografía consistente y escalado limitado (1.6x)
// para respetar el tamaño de fuente del sistema sin romper los layouts.
export default function Text({ variant = "body", color = colors.text, header = false, style, ...props }) {
    return (
        <RNText
            maxFontSizeMultiplier={1.6}
            accessibilityRole={header ? "header" : undefined}
            style={[type[variant], { color }, style]}
            {...props}
        />
    )
}
