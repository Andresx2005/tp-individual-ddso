import React from "react"
import { StyleSheet } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { colors } from "../theme"

// Contenedor base de pantallas dentro del stack (el header nativo ya resuelve el borde superior).
export default function Screen({ children, edges = ["left", "right", "bottom"], style }) {
    return <SafeAreaView edges={edges} style={[styles.root, style]}>{children}</SafeAreaView>
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.bg } })
