// Gives the player a JSON file: a download in the browser; in the Android or iPhone app, where
// the web view ignores downloads, the file is written to the app's cache and handed to the
// system's share sheet (save it to Files or Drive, send it by mail…).
// Plugins: @capacitor/filesystem and @capacitor/share (see docs/MOVIL.md).
export async function saveFile(text, name, title = name) {
  const native = globalThis.Capacitor?.isNativePlatform?.(),
    { Filesystem, Share } = globalThis.Capacitor?.Plugins || {};
  if (native && Filesystem && Share) {
    const { uri } = await Filesystem.writeFile({
      path: name,
      data: text,
      directory: 'CACHE',
      encoding: 'utf8',
    });
    try {
      await Share.share({ title, url: uri, dialogTitle: title });
    } catch (e) {
      // Closing the share sheet without choosing anything is not an error.
      if (!/cancel/i.test(e?.message || '')) throw e;
    }
    return;
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' })),
    a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
