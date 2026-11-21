import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import ExplorarScreen from "../screens/comprador/ExplorarScreen"
import FavoritosScreen from "../screens/comprador/FavoritosScreen"
import MisComprasScreen from "../screens/comprador/MisComprasScreen"
import PerfilScreen from "../screens/shared/PerfilScreen"
import { etiquetaTab, useTabScreenOptions } from "./tabOptions"

const Tab = createBottomTabNavigator()
// Los íconos son decorativos para el lector de pantalla: la etiqueta de la pestaña ya dice qué es.
const icono = (activo, inactivo) => ({ color, focused }) => (
    <Ionicons name={focused ? activo : inactivo} size={26} color={color} accessible={false} importantForAccessibility="no" />
)

export default function CompradorTabs() {
    const opciones = useTabScreenOptions()
    return (
        <Tab.Navigator screenOptions={opciones}>
            <Tab.Screen
                name="Explorar" component={ExplorarScreen}
                options={{ headerShown: false, tabBarLabel: "Explorar", tabBarIcon: icono("search", "search-outline"), ...etiquetaTab("Explorar eventos: buscar y comprar entradas") }}
            />
            <Tab.Screen
                name="Favoritos" component={FavoritosScreen}
                options={{ title: "Mis favoritos", tabBarLabel: "Favoritos", tabBarIcon: icono("heart", "heart-outline"), ...etiquetaTab("Favoritos: eventos que guardaste") }}
            />
            <Tab.Screen
                name="MisCompras" component={MisComprasScreen}
                options={{ title: "Mis compras", tabBarLabel: "Mis compras", tabBarIcon: icono("ticket", "ticket-outline"), ...etiquetaTab("Mis compras: estado de tus entradas y chat con el organizador") }}
            />
            <Tab.Screen
                name="Perfil" component={PerfilScreen}
                options={{ title: "Mi perfil", tabBarLabel: "Perfil", tabBarIcon: icono("person", "person-outline"), ...etiquetaTab("Perfil: tu cuenta y cerrar sesión") }}
            />
        </Tab.Navigator>
    )
}
