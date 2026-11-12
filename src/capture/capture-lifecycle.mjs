// Deterministic state and cancellation for one in-flight screenshot operation.
export const CAPTURE_STATES = Object.freeze(['idle', 'selecting', 'capturing', 'composing', 'publishing']);
export const CAPTURE_TIMEOUT_MS = 120_000;
export function createCaptureLifecycle(now = () => Date.now()) {
  let active = null;
  function begin(state, tabId, mode) {
    if (active) throw new Error('Eine Aufnahme läuft bereits.');
    if (!['selecting', 'capturing'].includes(state) || !Number.isInteger(tabId)) throw new Error('Ungültiger Aufnahmezustand.');
    const controller = new AbortController();
    active = {state, tabId, mode, startedAt: now(), controller};
    return active;
  }
  function transition(from, to) {
    if (!active || active.state !== from || !CAPTURE_STATES.includes(to) || to === 'idle') throw new Error('Ungültiger Zustandswechsel.');
    active.state = to;
    return active;
  }
  function abort(reason = 'Aufnahme abgebrochen.') {
    if (!active) return false;
    active.controller.abort(new Error(reason));
    active = null;
    return true;
  }
  function finish(job) { if (active === job) active = null; }
  return {begin, transition, abort, finish, get active() { return active; }, get state() { return active?.state || 'idle'; }};
}
export function throwIfCancelled(signal) {
  if (signal?.aborted) throw signal.reason instanceof Error ? signal.reason : new Error('Aufnahme abgebrochen.');
}
export async function cancellableDelay(ms, signal, sleep = (time, options) => new Promise((resolve, reject) => {
  const id = setTimeout(resolve, time);
  options?.signal?.addEventListener('abort', () => {clearTimeout(id); reject(options.signal.reason);}, {once: true});
})) {
  throwIfCancelled(signal);
  await sleep(ms, {signal});
  throwIfCancelled(signal);
}
export async function withTimeout(task, ms, signal, label = 'Browser-Anfrage') {
  if (!Number.isFinite(ms) || ms <= 0) throw new Error('Ungültiges Zeitlimit.');
  throwIfCancelled(signal);
  let timer;
  let onAbort;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label}: Zeitlimit überschritten.`)), ms);
  });
  const cancelled = new Promise((_, reject) => {
    if (!signal) return;
    onAbort = () => reject(signal.reason instanceof Error ? signal.reason : new Error('Aufnahme abgebrochen.'));
    signal.addEventListener('abort', onAbort, {once: true});
  });
  try { return await Promise.race([Promise.resolve().then(task), timeout, cancelled]); }
  finally { clearTimeout(timer); if (onAbort) signal.removeEventListener('abort', onAbort); }
}
