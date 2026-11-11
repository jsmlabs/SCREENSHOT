// Pure capture planning / validation, shared by the worker and Node tests.
export const TIMERS = Object.freeze([0, 3, 5, 10]);
export const MAX_TILES = 256;
export const MAX_PIXELS = 80_000_000;
export function timerSeconds(value) {
  if (!Number.isInteger(value) || !TIMERS.includes(value)) throw new Error('Ungültiger Aufnahme-Timer.');
  return value;
}
export function captureBounds(rect, viewport) {
  if (!rect || !viewport || ![rect.x,rect.y,rect.width,rect.height,viewport.width,viewport.height].every(Number.isFinite)) throw new Error('Ungültige Auswahl.');
  const x = Math.max(0, Math.min(viewport.width, rect.x));
  const y = Math.max(0, Math.min(viewport.height, rect.y));
  const right = Math.max(x, Math.min(viewport.width, rect.x + rect.width));
  const bottom = Math.max(y, Math.min(viewport.height, rect.y + rect.height));
  if (right - x < 3 || bottom - y < 3) throw new Error('Auswahl ist zu klein.');
  return {x, y, width:right-x, height:bottom-y};
}
export function tilePositions(height, viewportHeight) {
  if (!Number.isSafeInteger(height) || !Number.isSafeInteger(viewportHeight) || height <= 0 || viewportHeight <= 0) throw new Error('Ungültige Seitenhöhe.');
  const last = Math.max(0, height - viewportHeight), out = [];
  for (let y = 0; ; y = Math.min(last, y + viewportHeight)) {
    out.push(y);
    if (out.length > MAX_TILES) throw new Error('Zu viele Teilaufnahmen.');
    if (y === last) break;
  }
  return out;
}
export function validateFullSize(width, height, dpr) {
  if (![width,height,dpr].every(v => Number.isFinite(v) && v > 0)) throw new Error('Ungültige Bildabmessungen.');
  if (width*dpr > 32000 || height*dpr > 32000 || width*height*dpr*dpr > MAX_PIXELS) throw new Error('Seite ist zu gross für eine zuverlässige Aufnahme.');
}
