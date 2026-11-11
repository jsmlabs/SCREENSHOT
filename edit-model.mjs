import {validAnnotation} from './edit-objects.mjs';
// Pure, non-destructive editing state. Coordinates use original image pixels.
export const MAX_HISTORY = 60;
export const MIN_CROP_SIZE = 3;
export function initialEdit(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) throw new Error('Invalid image dimensions');
  return {crop: {x: 0, y: 0, w: width, h: height}, annotations: []};
}
export function cloneEdit(state) {
  return {crop: {...state.crop}, annotations: state.annotations.map(item => ({...item, points: item.points?.map(p => ({...p}))}))};
}
export function createHistory(initial) { return {states: [cloneEdit(initial)], index: 0}; }
export function current(history) { return history.states[history.index]; }
export function commit(history, newState) {
  const states = [...history.states.slice(0, history.index + 1), cloneEdit(newState)].slice(-MAX_HISTORY);
  return {states, index: states.length - 1};
}
export function undo(history) { return {...history, index: Math.max(0, history.index - 1)}; }
export function redo(history) { return {...history, index: Math.min(history.states.length - 1, history.index + 1)}; }
export function canUndo(history) { return history.index > 0; }
export function canRedo(history) { return history.index < history.states.length - 1; }
export function localToSource(state, point) {
  return {x: point.x + state.crop.x, y: point.y + state.crop.y};
}
export function boundedPoint(point, w, h) {
  return {x: Math.max(0, Math.min(w, point.x)), y: Math.max(0, Math.min(h, point.y))};
}
export function rectBetween(start, end) {
  return {x: Math.min(start.x, end.x), y: Math.min(start.y, end.y), w: Math.abs(end.x-start.x), h: Math.abs(end.y-start.y)};
}
export function applyCrop(state, start, end) {
  const a = boundedPoint(start, state.crop.w, state.crop.h);
  const b = boundedPoint(end, state.crop.w, state.crop.h);
  const rect = rectBetween(a,b);
  if (rect.w < MIN_CROP_SIZE || rect.h < MIN_CROP_SIZE) return null;
  return {...cloneEdit(state), crop: {
    x: state.crop.x + rect.x, y: state.crop.y + rect.y, w: rect.w, h: rect.h
  }};
}
export function addAnnotation(state, annotation) {
  return {...cloneEdit(state), annotations: [...state.annotations, {...annotation, points: annotation.points?.map(p=>({...p}))}]};
}
export function validateEdit(state, width, height) {
  const c = state?.crop;
  if (!c || ![c.x,c.y,c.w,c.h].every(Number.isFinite) || c.x < 0 || c.y < 0 || c.w <= 0 || c.h <= 0 || c.x+c.w > width+.001 || c.y+c.h > height+.001) return false;
  return Array.isArray(state.annotations) && state.annotations.every(a => validAnnotation(a));
}
