# Apps para Android y iPhone

El juego ya funciona entero en el navegador y sin conexión. Las apps lo empaquetan tal cual con
[Capacitor](https://capacitorjs.com): una vista web nativa que sirve los archivos de `dist/` desde
el propio teléfono. No hay servidor: las preguntas se responden en el dispositivo y las partidas
se guardan en el almacenamiento de la app.

## Qué hace falta

- Node 22 o posterior.
- Android: Android Studio (con su JDK y el SDK de Android).
- iPhone: un Mac con Xcode y CocoaPods o Swift Package Manager, y una cuenta de Apple para firmar.

## Primera vez

```bash
npm install
npm run build
npx cap add android
npx cap add ios
```

`cap add` crea las carpetas `android/` e `ios/` con los proyectos nativos. Conviene subirlas al
repositorio después de crearlas (cambios de icono, nombre o permisos se hacen ahí).

## Cada vez que cambia el juego

```bash
npm run app:android   # construye dist/, lo copia al proyecto y abre Android Studio
npm run app:ios       # lo mismo con Xcode (en el Mac)
```

En Android Studio: **Build › Build App Bundle(s) / APK(s) › Build APK(s)**. El APK de pruebas
queda en `android/app/build/outputs/apk/debug/app-debug.apk`; para instalarlo en el móvil hay que
permitir «instalar aplicaciones de origen desconocido». Para Google Play se genera un paquete
firmado (**Build › Generate Signed App Bundle**).

En Xcode: elegir el equipo de firma en *Signing & Capabilities*, conectar el iPhone y pulsar
*Run*. Para TestFlight o la App Store, *Product › Archive*.

## Datos de la app

- Identificador: `es.blackwood.detectives`; nombre: «Blackwood» (`capacitor.config.json`).
- Iconos: `public/icons/icon-512.png` sirve de origen. Con `npx @capacitor/assets generate` se
  crean todos los tamaños para las dos plataformas (pide una carpeta `assets/` con `icon.png`).
- Dentro de la app no se registra el service worker: los archivos ya están en el teléfono y así
  una actualización nunca choca con una caché antigua.
- La página respeta las zonas seguras (notch, barra de estado, indicador de inicio) con
  `viewport-fit=cover` y `env(safe-area-inset-*)`.

## Limitaciones conocidas

- «Guardar una copia» descarga un archivo con el navegador; dentro de la vista web de Android e
  iOS esa descarga no hace nada. Si hace falta, se puede cambiar por los plugins
  `@capacitor/filesystem` y `@capacitor/share`. «Abrir una copia» sí funciona (selector de
  archivos).
- «Leer en voz alta» usa la voz del sistema: en Android depende de que la vista web exponga
  `speechSynthesis` (si no, la opción no aparece en el menú).
