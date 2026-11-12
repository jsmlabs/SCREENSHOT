// Serializes clipboard writes and ensures only the newest capture reports success.
// A failed write caused by lost focus remains retryable when focus returns.
export function createAutomaticClipboard({write, canWrite, onStatus}) {
  let pending = null;
  let sequence = 0;
  let running = false;
  let activeWrite = null;
  const report = (state, detail = '') => onStatus(state, detail);
  const permissionBlocked = error => ['NotAllowedError', 'SecurityError'].includes(error?.name);
  async function flush() {
    if (running || pending === null || !canWrite()) return;
    running = true;
    const current = pending;
    const ticket = sequence;
    try {
      activeWrite = Promise.resolve(write(current));
      await activeWrite;
      if (ticket === sequence) { pending = null; report('copied'); }
    } catch (error) {
      if (ticket === sequence) {
        if (!canWrite() || permissionBlocked(error)) {
          // Keep this image pending; only a future focus/user activation may retry.
          report('blocked', error?.message || String(error));
        } else { pending = null; report('failed', error?.message || String(error)); }
      }
    } finally {
      activeWrite = null;
      running = false;
      // If a new capture arrived during a clipboard write, process it too.
      if (ticket !== sequence && pending !== null && canWrite()) void flush();
    }
  }
  return {
    schedule(data) { pending = data; sequence++; report('pending'); void flush(); },
    flush,
    cancel() { pending = null; sequence++; },
    async cancelAndWait() { this.cancel(); if (activeWrite) await activeWrite.catch(() => {}); },
    get pending() { return pending !== null; }
  };
}
