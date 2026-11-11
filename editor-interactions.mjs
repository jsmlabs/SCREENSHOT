// Pure interaction preferences and pointer geometry. Independent of browser runtime.
export const TOOLS = Object.freeze(['pan','select','crop','rect','arrow','pen','text','blur','pixelate']);
export const STROKE_WIDTHS = Object.freeze([2,4,8,12]);
export function strokeWidth(value) {
  const n = Number(value);
  return STROKE_WIDTHS.includes(n) ? n : 4;
}
export function toolForKey(key) {
  return ({v:'pan',s:'select',b:'blur',i:'pixelate',c:'crop',r:'rect',a:'arrow',p:'pen',t:'text'})[String(key).toLowerCase()] ?? null;
}
export function shouldHandleShortcut(target, modifiers) {
  if (modifiers.ctrlKey || modifiers.metaKey || modifiers.altKey) return false;
  return !target?.closest?.('input,textarea,select,[contenteditable=""],[contenteditable="true"],button');
}
export function normalisedWheelDelta(delta, mode, viewportHeight) {
  if (!Number.isFinite(delta)) return 0;
  const factor = mode === 1 ? 16 : mode === 2 ? Math.max(1, viewportHeight) : 1;
  return Math.max(-500,Math.min(500,delta*factor));
}
export function sameCrop(a,b) {
  return !!a && !!b && ['x','y','w','h'].every(key=>a[key]===b[key]);
}
