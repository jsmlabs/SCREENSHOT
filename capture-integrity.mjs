// Capture boundaries must remain stable while the viewport is tiled.
export const MAX_CAPTURE_DATA_CHARS = 128_000_000;
export function totalCaptureBytes(previous, next) {
  if (![previous, next].every(Number.isSafeInteger) || previous < 0 || next < 0 || previous + next > MAX_CAPTURE_DATA_CHARS)
    throw new Error('Aufnahme überschreitet das sichere Speicherlimit.');
  return previous + next;
}
export function pageMetricsStable(actual, expected) {
  if (!actual || !expected || ![actual.x,actual.y,actual.width,actual.height,actual.pageWidth,actual.pageHeight,
    expected.x,expected.y,expected.width,expected.height,expected.pageWidth,expected.pageHeight].every(Number.isFinite))
    throw new Error('Ungültige Seitenmetriken.');
  if (Math.abs(actual.x-expected.x)>2 || Math.abs(actual.y-expected.y)>2 ||
      actual.width!==expected.width || actual.height!==expected.height ||
      Math.abs(actual.pageWidth-expected.pageWidth)>2 || Math.abs(actual.pageHeight-expected.pageHeight)>2)
    throw new Error('Seitenlayout oder Scrollposition hat sich während der Aufnahme verändert.');
  return true;
}
