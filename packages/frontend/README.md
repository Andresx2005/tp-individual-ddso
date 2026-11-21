# AI Ticket It – App móvil (React Native / Expo)

Frontend móvil de la plataforma de venta de entradas. Dos roles (**COMPRADOR** y **ORGANIZADOR**) con navegación propia, consumiendo la API REST del backend (`/api`).

## Cómo correrla

```bash
npm install
npx expo install --fix        # alinea las versiones con el SDK de Expo que tengas instalado
cp .env.example .env          # y ajustá EXPO_PUBLIC_API_URL (ver comentarios del archivo)
npx expo start                # escaneá el QR con Expo Go, o presioná "a" (Android) / "i" (iOS)
```

> Los `package.json` pinneados apuntan a Expo SDK 52. `npx expo install --fix` actualiza lo necesario si usás otro SDK.
> Desde un celular físico, el backend tiene que ser alcanzable por la red local (no uses `localhost`).

## Estructura

```
App.js                      Providers (SafeArea, Toast, Auth, Favoritos) + fuentes + navegación
src/
  api/                      TODO el acceso al backend. Si la API cambia, se toca sólo acá
    client.js               fetch + Bearer + refresh automático (single-flight) + errores normalizados
    auth.js eventos.js compras.js favoritos.js
  context/                  AuthContext (sesión en SecureStore), FavoritosContext (corazones optimistas)
  hooks/                    useRequest, usePaginated (scroll infinito), useDebounce, useRefreshOnFocus
  navigation/               Stack raíz condicionado por sesión + tabs por rol
  components/               Design system propio: Text, Button, TextField, Chip, EstadoBadge, BottomSheet, …
  screens/{auth,comprador,organizador,shared}
  theme/ utils/             Tokens de diseño, formateo es-AR, estados de compra, manejo de errores
```
