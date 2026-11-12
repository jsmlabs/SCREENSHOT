// Choose the originating HTTP(S) tab when possible; never capture extension or internal pages.
export const isCaptureMode = mode => ['area','element','visible','window','full'].includes(mode);
export function findCaptureTab(tabs, preferredId = null) {
  if (!Array.isArray(tabs)) return null;
  const eligible = tabs.filter(tab => Number.isInteger(tab?.id) && Number.isInteger(tab?.windowId) && /^https?:\/\//i.test(tab.url || ''));
  return eligible.find(tab => tab.id === preferredId) || eligible.find(tab => tab.active) || null;
}
