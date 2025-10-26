# Uma Tools — Web a App móvil (PWA + Capacitor)

Este paquete convierte tu proyecto en:
- PWA instalable (offline básico con Service Worker).
- App nativa Android/iOS mediante Capacitor (WebView con APIs nativas cuando quieras).

## Requisitos
- Node 18+ y npm
- Android Studio (para Android) / Xcode (para iOS)

## Scripts
- `npm run dev` — desarrollo web (Vite).
- `npm run build` — genera `dist/`.
- `npm run cap:init` — crea el proyecto Capacitor (una vez tras clonar).
- `npm run cap:add:android` — añade plataforma Android.
- `npm run cap:add:ios` — añade plataforma iOS (en macOS).
- `npm run cap:sync` — copia `dist/` a plataformas.
- `npm run cap:open:android` — abre Android Studio.
- `npm run cap:open:ios` — abre Xcode.

## Pasos Android
1. `cd uma-tools && npm install`
2. `npm run build`
3. `npm run cap:init` (una vez; ajusta `appId` si quieres)
4. `npm run cap:add:android` (una vez)
5. `npm run cap:sync`
6. `npm run cap:open:android` y ejecuta en emulador/dispositivo.

## Pasos iOS (macOS)
1. `cd uma-tools && npm install && npm run build`
2. `npm run cap:add:ios` (una vez)
3. `npm run cap:sync`
4. `npm run cap:open:ios` y compila desde Xcode.

## Live reload en dispositivo
- Corre `npm run dev`.
- En `capacitor.config.ts`, descomenta `server.url` y coloca tu IP local (ej. `http://192.168.1.100:5173`), pon `cleartext: true`.
- `npm run cap:sync` y ejecuta; verás cambios al guardar.

## Iconos
- Añade PNGs en `public/icons/`:
  - `icon-192.png`
  - `icon-512.png`
- Para splash/íconos nativos, instala `@capacitor/assets` y ejecuta `npx capacitor-assets generate`.

## Datos de compatibilidad
- Rellena `data/compat-groups.json` con grupos y `data/char-wins.json` con victorias G1; ajusta `data/races.json` si necesitas más carreras.
- Si prefieres el modo simple por etiquetas, cambia `mode` a `"simple"` en `data/compat-rules.json`.

## Aviso
Este repo no copia datos de terceros; los formatos están listos para que importes tus datos propios.