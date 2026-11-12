// Fail closed if the source tab was replaced, navigated or deactivated during capture.
// Hash-only navigation does not change the screenshot document.
export function assertCaptureSource(tab, expected = null) {
  if (!tab || !Number.isInteger(tab.id) || !Number.isInteger(tab.windowId) ||
      typeof tab.url !== 'string' || !/^https?:\/\//i.test(tab.url))
    throw new Error('Die Quellwebseite ist nicht mehr verfügbar.');
  if (!tab.active) throw new Error('Der Quelltab ist nicht mehr aktiv.');
  if (expected) {
    if (tab.id !== expected.id || tab.windowId !== expected.windowId ||
        tab.url.split('#')[0] !== expected.url.split('#')[0])
      throw new Error('Die Quellwebseite wurde während der Aufnahme gewechselt. Bitte erneut aufnehmen.');
  }
  return {id:tab.id, windowId:tab.windowId, url:tab.url};
}
