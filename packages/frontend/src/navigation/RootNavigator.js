import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { useAuth } from "../context/AuthContext"
import { LoadingView } from "../components/States"
import CompradorTabs from "./CompradorTabs"
import OrganizadorTabs from "./OrganizadorTabs"
import LoginScreen from "../screens/auth/LoginScreen"
import RegistroScreen from "../screens/auth/RegistroScreen"
import EventoDetalleScreen from "../screens/shared/EventoDetalleScreen"
import ReseniasScreen from "../screens/shared/ReseniasScreen"
import CompraDetalleScreen from "../screens/shared/CompraDetalleScreen"
import ChatScreen from "../screens/shared/ChatScreen"
import CalificarScreen from "../screens/comprador/CalificarScreen"
import EventoComprasScreen from "../screens/organizador/EventoComprasScreen"
import CrearEventoScreen from "../screens/organizador/CrearEventoScreen"
import { colors, fonts } from "../theme"

const Stack = createNativeStackNavigator()

// Header verde de marca (30 %) con texto blanco (contraste 6:1) y flecha de volver siempre visible.
export const headerOptions = {
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.onPrimary,
    headerTitleStyle: { fontFamily: fonts.bold, fontSize: 18 },
    headerBackButtonDisplayMode: "minimal",
    contentStyle: { backgroundColor: colors.bg }
}

export default function RootNavigator() {
    const { status, user } = useAuth()
    if (status === "loading") return <LoadingView mensaje="Abriendo AI Ticket It…" />

    return (
        <Stack.Navigator screenOptions={headerOptions}>
            {status === "in" ? (
                <>
                    {/* La sesión decide el árbol de navegación: cada rol ve sólo lo que puede usar (heurística 5: prevención de errores) */}
                    <Stack.Screen name="Main" component={user?.rol === "ORGANIZADOR" ? OrganizadorTabs : CompradorTabs} options={{ headerShown: false }} />
                    <Stack.Screen name="EventoDetalle" component={EventoDetalleScreen} options={{ title: "Evento" }} />
                    <Stack.Screen name="Resenias" component={ReseniasScreen} options={{ title: "Reseñas" }} />
                    <Stack.Screen name="CompraDetalle" component={CompraDetalleScreen} options={{ title: "Mi compra" }} />
                    <Stack.Screen name="Chat" component={ChatScreen} options={{ title: "Mensajes" }} />
                    <Stack.Screen name="Calificar" component={CalificarScreen} options={{ title: "Calificar evento" }} />
                    <Stack.Screen name="EventoCompras" component={EventoComprasScreen} options={{ title: "Compras del evento" }} />
                    <Stack.Screen name="CrearEvento" component={CrearEventoScreen} options={{ title: "Nuevo evento" }} />
                </>
            ) : (
                <>
                    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                    <Stack.Screen name="Registro" component={RegistroScreen} options={{ title: "Crear cuenta" }} />
                </>
            )}
        </Stack.Navigator>
    )
}
