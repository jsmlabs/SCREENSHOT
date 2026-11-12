export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 8;
export const PREVIEW_GAP = 6;
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}
export function fitScale(iw, ih, vw, vh) {
  if (![iw, ih, vw, vh].every(v => Number.isFinite(v) && v > 0)) return 1;
  return Math.min(1, vw / iw, vh / ih);
}
// The viewport already excludes the permanent 6px frame gap.
// Small images stay wholly inside; large images cover the entire clipped viewport.
export function axisLimit(image, viewport, scale) {
  if (![image, viewport, scale].every(v => Number.isFinite(v) && v > 0)) return 0;
  return Math.abs(viewport - image * scale) / 2;
}
export function constrainPan(x, y, iw, ih, vw, vh, scale) {
  const lx = axisLimit(iw, vw, scale), ly = axisLimit(ih, vh, scale);
  return {x: clamp(x, -lx, lx), y: clamp(y, -ly, ly)};
}
export function anchoredPan(x, y, oldScale, newScale, ax, ay) {
  if (![x,y,oldScale,newScale,ax,ay].every(Number.isFinite) || oldScale <= 0) return {x:0,y:0};
  const ratio = newScale / oldScale;
  return {x: ax - (ax - x) * ratio, y: ay - (ay - y) * ratio};
}
export function imagePosition(iw, ih, vw, vh, scale, x, y) {
  const pan = constrainPan(x, y, iw, ih, vw, vh, scale);
  return {left: (vw - iw * scale) / 2 + pan.x, top: (vh - ih * scale) / 2 + pan.y, ...pan};
}
