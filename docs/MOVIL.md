# Apps para Android y iPhone

El juego ya funciona entero en el navegador y sin conexión. Las apps lo empaquetan tal cual con
[Capacitor](https://capacitorjs.com): una vista web nativa que sirve los archivos de `dist/` desde
el propio teléfono. No hay servidor: las preguntas se responden en el dispositivo y las partidas
se guardan en el almacenamiento de la app.

## Qué hace falta

- Node 22 o posterior.
- Android: Android Studio (con su JDK y el SDK de Android).
- iPhone: un Mac con Xcode 16 o posterior y una cuenta de Apple para firmar. El proyecto usa Swift
  Package Manager, así que no hace falta CocoaPods.

## Primera vez

Las carpetas `android/` e `ios/` ya están en el repositorio, con los iconos y la pantalla de carga.
Basta con:

```bash
npm install
npm run build
```

Si alguna vez hay que crearlas de nuevo: `npx cap add android` y `npx cap add ios --packagemanager SPM`.

## Cada vez que cambia el juego

```bash
npm run app:android   # construye dist/, lo copia al proyecto y abre Android Studio
npm run app:ios       # lo mismo con Xcode (en el Mac)
```

En Android Studio: **Build › Build App Bundle(s) / APK(s) › Build APK(s)**. El APK de pruebas
queda en `android/app/build/outputs/apk/debug/app-debug.apk`; para instalarlo en el móvil hay que
permitir «instalar aplicaciones de origen desconocido». Para Google Play se genera un paquete
firmado (**Build › Generate Signed App Bundle**).

Sin abrir Android Studio, el APK de pruebas también sale desde la terminal (en Windows, con el JDK
que trae Android Studio):

```bash
npx cap sync android
cd android && ./gradlew assembleDebug
```

Antes hay que crear `android/local.properties` con la ruta del SDK, por ejemplo
`sdk.dir=D:/AndroidSdk` (con barras normales; ese archivo no se sube).

En Xcode: abrir `ios/App/App.xcodeproj` (lo hace `npm run app:ios`), elegir el equipo de firma en *Signing & Capabilities*, conectar el iPhone y pulsar
*Run*. Para TestFlight o la App Store, *Product › Archive*.

## Datos de la app

- Identificador: `es.blackwood.detectives`; nombre: «Blackwood» (`capacitor.config.json`).
- Iconos y pantalla de carga: salen de `assets/` (la lupa de `public/icons/icon-512.png` sobre el
  fondo `#101b23`). En Android el icono es adaptativo: `icon-foreground.png` deja margen para que
  el sistema no recorte la lupa. Tras cambiar esas imágenes, `npx capacitor-assets generate`
  rehace todos los tamaños de las dos plataformas.
- En iPhone la app usa siempre el modo oscuro (`UIUserInterfaceStyle` en `Info.plist`), para que
  la barra de estado se lea sobre el fondo oscuro del juego.
- Dentro de la app no se registra el service worker: los archivos ya están en el teléfono y así
  una actualización nunca choca con una caché antigua.
- La página respeta las zonas seguras (notch, barra de estado, indicador de inicio) con
  `viewport-fit=cover` y `env(safe-area-inset-*)`.

## Limitaciones conocidas

- «Guardar una copia» y «Descargar expediente» (editor): en la app, la vista web no descarga
  archivos, así que `public/save-file.mjs` escribe el archivo en la caché de la app
  (`@capacitor/filesystem`) y abre el menú de compartir del sistema (`@capacitor/share`), desde
  el que se guarda en Archivos o Drive o se envía. Probado en el emulador de Android. «Abrir una
  copia» usa el selector de archivos del sistema.
- «Leer en voz alta» usa la voz del sistema: en Android depende de que la vista web exponga
  `speechSynthesis` (si no, la opción no aparece en el menú).
