import React, { useCallback } from "react"
import { View } from "react-native"
import { StatusBar } from "expo-status-bar"
import * as SplashScreen from "expo-splash-screen"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"
import { useFonts, AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold } from "@expo-google-fonts/atkinson-hyperlegible"
import { ToastProvider } from "./src/components/Toast"
import { AuthProvider } from "./src/context/AuthContext"
import { FavoritosProvider } from "./src/context/FavoritosContext"
import RootNavigator from "./src/navigation/RootNavigator"
import { colors } from "./src/theme"

SplashScreen.preventAutoHideAsync().catch(() => {})

const navTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border }
}

export default function App() {
    const [fuentesListas] = useFonts({ AtkinsonHyperlegible_400Regular, AtkinsonHyperlegible_700Bold })

    const alLayout = useCallback(() => {
        if (fuentesListas) SplashScreen.hideAsync().catch(() => {})
    }, [fuentesListas])

    if (!fuentesListas) return null

    return (
        <SafeAreaProvider>
            <View style={{ flex: 1 }} onLayout={alLayout}>
                <StatusBar style="light" backgroundColor={colors.primary} />
                <ToastProvider>
                    <AuthProvider>
                        <FavoritosProvider>
                            <NavigationContainer theme={navTheme}>
                                <RootNavigator />
                            </NavigationContainer>
                        </FavoritosProvider>
                    </AuthProvider>
                </ToastProvider>
            </View>
        </SafeAreaProvider>
    )
}
