import {totalCaptureBytes} from './capture-integrity.mjs';
// Allow only extension-owned UI to issue privileged worker commands.
export function isTrustedUiSender(sender, runtime) {
  if (!sender || sender.id !== runtime.id || typeof sender.url !== 'string') return false;
  return sender.url === runtime.getURL('popup.html');
}

// Offscreen composition is an internal worker-only operation.
export function isWorkerSender(sender, runtime) {
  return !!sender && sender.id === runtime.id && sender.url === runtime.getURL('background.js');
}

export function isSelectionSender(sender, job) {
  return !!job && Number.isInteger(sender?.tab?.id) && sender.tab.id === job.tabId
    && /^https?:\/\//.test(sender.frameId === 0 ? sender.url || '' : '');
}

export function validateComposeMessage(message) {
  if (!message || !['visible', 'area', 'element', 'full'].includes(message.mode)) throw new Error('Ungültiger Bildmodus.');
  if (![message.width, message.height, message.viewport?.width, message.viewport?.height].every(n => Number.isFinite(n) && n > 0))
    throw new Error('Ungültige Bildabmessungen.');
  if (!Array.isArray(message.shots) || message.shots.length < 1 || message.shots.length > 256)
    throw new Error('Ungültige Anzahl an Teilaufnahmen.');
  if (message.mode !== 'full' && message.shots.length !== 1) throw new Error('Unerwartete Anzahl an Teilaufnahmen.');
  if (message.mode === 'full' && message.shots.length * message.viewport.height < message.height)
    throw new Error('Unvollständige Vollseitenaufnahme.');
  let totalLength = 0;
  for (const shot of message.shots) {
    if (!shot || !Number.isFinite(shot.x) || !Number.isFinite(shot.y)
      || typeof shot.data !== 'string' || !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(shot.data)
      || shot.data.length > 120_000_000) throw new Error('Ungültige PNG-Kachel.');
    totalLength = totalCaptureBytes(totalLength, shot.data.length);
  }
  if (message.mode === 'area' || message.mode === 'element') {
    const {x,y,width,height} = message.selection || {};
    if (![x,y,width,height].every(Number.isFinite) || width < 3 || height < 3)
      throw new Error('Ungültiger Zuschneidebereich.');
  }
}
