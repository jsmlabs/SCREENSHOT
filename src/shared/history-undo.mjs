// Keep a bounded, session-only recovery stack for recent history deletions.
// Captures are restored under their original storage keys without losing metadata.
export function createHistoryUndo(storage, notify = () => {}, maxEntries = 5) {
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1) throw new RangeError('Invalid undo limit');
  const pending = [];
  return {
    get canUndo() { return pending.length > 0; },
    get count() { return pending.length; },
    async remove(key, record) {
      if (typeof key !== 'string' || !key.startsWith('capture:') || !record || typeof record !== 'object')
        throw new TypeError('Invalid capture');
      await storage.remove(key);
      // Avoid restoring a stale copy when the same key was deleted repeatedly.
      const prior = pending.findIndex(entry => entry.key === key);
      if (prior !== -1) pending.splice(prior, 1);
      pending.push({key, record});
      if (pending.length > maxEntries) pending.shift();
      notify(true);
    },
    async undo() {
      if (!pending.length) return false;
      const {key, record} = pending[pending.length - 1];
      // Never overwrite a new capture reusing the original key.
      if ((await storage.get(key))[key] !== undefined) {
        pending.pop();
        notify(pending.length > 0);
        return false;
      }
      // If storage rejects the write, keep this entry for another attempt.
      await storage.set({[key]: record});
      pending.pop();
      notify(pending.length > 0);
      return true;
    },
    clear() {
      pending.length = 0;
      notify(false);
    }
  };
}
