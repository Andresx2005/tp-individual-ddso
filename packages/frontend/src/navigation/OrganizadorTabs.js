import React from "react"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"
import MisEventosScreen from "../screens/organizador/MisEventosScreen"
import PerfilScreen from "../screens/shared/PerfilScreen"
import { etiquetaTab, useTabScreenOptions } from "./tabOptions"

const Tab = createBottomTabNavigator()
const icono = (activo, inactivo) => ({ color, focused }) => (
    <Ionicons name={focused ? activo : inactivo} size={26} color={color} accessible={false} importantForAccessibility="no" />
)

export default function OrganizadorTabs() {
    const opciones = useTabScreenOptions()
    return (
        <Tab.Navigator screenOptions={opciones}>
            <Tab.Screen
                name="MisEventos" component={MisEventosScreen}
                options={{ title: "Mis eventos", tabBarLabel: "Mis eventos", tabBarIcon: icono("calendar", "calendar-outline"), ...etiquetaTab("Mis eventos: crear eventos y ver sus ventas") }}
            />
            <Tab.Screen
                name="Perfil" component={PerfilScreen}
                options={{ title: "Mi perfil", tabBarLabel: "Perfil", tabBarIcon: icono("person", "person-outline"), ...etiquetaTab("Perfil: tu cuenta y cerrar sesión") }}
            />
        </Tab.Navigator>
    )
}
