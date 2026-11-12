// Runs in the source tab, independently of the Manifest V3 service worker.
// Restores the page if the worker disappears after starting a full-page capture.
(() => {
  const rule = document.getElementById('screenshot-v15-hide-floating');
  if (!rule || !rule.dataset.restore) return;
  const started = Number(rule.dataset.started);
  if (!Number.isFinite(started)) return;
  const restore = () => {
    if (!rule.isConnected) return;
    try {
      const state = JSON.parse(rule.dataset.restore);
      rule.remove();
      document.querySelectorAll('[data-screenshot-v15-floating="capture"]').forEach(el => el.removeAttribute('data-screenshot-v15-floating'));
      document.documentElement.style.scrollBehavior = 'auto';
      if (document.body) document.body.style.scrollBehavior = 'auto';
      window.scrollTo({left:state.x,top:state.y,behavior:'instant'});
      document.documentElement.style.scrollBehavior = state.rootBehavior;
      if (document.body) document.body.style.scrollBehavior = state.bodyBehavior;
    } catch (error) { console.warn('SCREENSHOT page recovery:', error); }
  };
  // Conservative 125 s watchdog: normal captures clean up in the worker finally.
  const remaining = Math.max(0, 125_000 - (Date.now() - started));
  setTimeout(restore, remaining);
})();
