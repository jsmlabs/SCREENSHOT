# SCREENSHOT 1.18.0 - Verification and acceptance

**Source candidate:** 1.18.0, November 12, 2026. This report distinguishes automated local source checks from browser-host acceptance. No Chrome Web Store publication is claimed.

## Automated verification

| Check | Result | Scope |
| --- | --- | --- |
| `node --test tests/*.test.mjs` | **PASS - 144/144** | Mocked Chrome interfaces, modules and source contracts |
| `node tests/release-check.mjs` | **PASS** | Manifest, entrypoints, unsafe script/eval checks |
| `node --check` (JS/MJS application and tests) | **PASS** | Syntax only |
| JSON parse (`manifest.json`, `_locales/*/messages.json`) | **PASS** | Parseability |
| Relative Markdown links | **PASS** | Local referenced paths |
| Archive member/CRC check | Check final prepared ZIP | Packaging, not execution |

Checks above are from the local source candidate. Re-run after any future changes. None establishes that OS clipboard, browser permissions or pixels from a real Chrome capture function correctly.

## Browser acceptance - pending

1. Install unpacked in current Chrome and Edge. Open the popup/editor without console errors.
2. Test five modes (area, element, visible, window and full page), including unsupported URLs and user cancellations.
3. Switch tabs, navigate, close a source tab and suspend/reload the worker during capture. Confirm clean failure and recovery.
4. Test full-page stitching at multiple scale factors, lazy-loading pages, fixed headers and high/tall pages. Confirm scroll/style restoration on failure.
5. Verify original auto-copy in a separate native app and edited PNG copy/download. Check OS clipboard permission failures.
6. Test editor tools, undo/redo, annotation move/resize, new capture from an existing editor, export fidelity and focus behavior.
7. Test all five languages, light/dark/forced-color layouts, narrow popup, keyboard focus, accessibility names and reduced-motion preferences.
8. Test history search including accents, favorites, rename, repeated clicks, rapid typing during asynchronous updates, export and storage estimate; verify after reopening the popup.
9. Test large histories for first-open latency, storage quota errors, retention caps, favorites and explicit clear-history/rollback behavior.

## Known limitations

- Browser tests historically encountered `net::ERR_BLOCKED_BY_ADMINISTRATOR` or extension-service-worker startup timeouts in restricted environments. Those are blocked checks, not browser passes.
- PNGs are stored as local data URLs; initial history hydration reads them into memory. v1.18.0 avoids a new full-store read on *each filter change* within the current popup only.
- Blur/pixelation does not securely redact secrets.
- Storage and download handling are browser/OS dependent, and favorite screenshots are not permanent backups.

## Previous versions

Historical 1.9.x through 1.17.0 verification reports and older test evidence are retained under [`docs/archive/`](docs/archive/). Reported pass counts from earlier versions are not evidence about the current candidate.
