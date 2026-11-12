// Shared PNG clipboard writer for extension pages and the offscreen document.
export async function copyPngToClipboard(data, clipboard = globalThis.navigator?.clipboard, ClipboardItemType = globalThis.ClipboardItem) {
  if (typeof data !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(data))
    throw new Error('Ungültiges PNG für die Zwischenablage.');
  if (typeof clipboard?.write !== 'function' || !ClipboardItemType)
    throw new Error('Bild-Zwischenablage wird von diesem Browser nicht unterstützt.');
  const response = await fetch(data);
  const blob = await response.blob();
  await clipboard.write([new ClipboardItemType({'image/png': blob})]);
}
