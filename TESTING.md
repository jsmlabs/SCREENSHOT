# SCREENSHOT v1.18.3 - Local verification (2026-11-12)

- Multiple history undo: five-deletion cap, reverse order, duplicate key, failed storage writes, collision handling.
- `node --test tests/*.test.mjs`: **166 passed, 0 failed**.
- `python -m unittest discover -s tests -p test_runtime_packaging.py`: **8 passed, 0 failed**.
- `node tests/release-check.mjs`: **PASS**.
- Browser acceptance deliberately skipped at user request; Chrome runtime behavior unverified.

# SCREENSHOT v1.18.2 - Local verification (2026-11-12)

- `node --test tests/*.test.mjs`: **162 passed, 0 failed**.
- `python -m unittest discover -s tests -p 'test_runtime_packaging.py'`: **8 passed, 0 failed**.
- `node tests/release-check.mjs`: **PASS**.
- History Undo tests cover successful recovery, preserved original metadata, storage deletion failure, retryable restore failure, key collision and clearing pending recovery.
- Undo holds one deleted screenshot in memory only while the popup remains open. Closing the popup discards recovery. Clearing all history still requires confirmation and clears the pending undo.
- Runtime packager produced an archive with **41 files** (one additional JS module).
- **Manual Chrome/Edge browser acceptance intentionally skipped at user request.** Browser runtime and Chrome Web Store publication remain unverified.

---

## Conditional runtime reference validation - 2026-11-12

- Node.js `node --test tests/*.test.mjs`: **159 passed, 0 failed**.
- Python `python -m unittest discover -s tests -p test_runtime_packaging.py -v`: **8 passed, 0 failed**.
- Standalone static release check: **1 passed** (also included in the 157 Node.js tests).
- Conditional `executeScript({ files: [condition ? a : b] })` references checked for both literal branches.
- Manual Chrome acceptance: expressly waived; Chrome runtime behavior unverified.

# SCREENSHOT 1.18.1 - Previous verification and acceptance

**Source candidate:** 1.18.1, November 12, 2026. This report distinguishes automated local source checks from browser-host acceptance. No Chrome Web Store publication is claimed.

## Automated verification

| Check | Result | Scope |
| --- | --- | --- |
| `node --test tests/*.test.mjs` | **PASS - 159/159** | Mocked Chrome interfaces, modules and source contracts |
| `node tests/release-check.mjs` | **PASS** | Manifest, entrypoints, local imports and assets, unsafe script/eval checks |
| `node --check` (JS/MJS application and tests) | **PASS** | Syntax only |
| JSON parse (`manifest.json`, `_locales/*/messages.json`) | **PASS** | Parseability |
| Relative Markdown links | **PASS** | Local referenced paths |
| Archive member/CRC check | Check final prepared ZIP | Packaging, not execution |

Checks above are from the local source candidate. Re-run after any future changes. None establishes that OS clipboard, browser permissions or pixels from a real Chrome capture function correctly.

## Test harness compatibility correction (2026-11-12)

Five existing Node VM test files now strip `import` lines with an optional carriage return (`\r?\n`). Previously, the fixture preparation only accepted LF while the service worker source uses CRLF; nine tests failed during VM parsing before reaching their assertions. The production service worker and capture logic were not changed by this correction. The complete local Node suite now passes 155/155.

## Branding asset integrity audit (2026-11-12)

- `tests/branding.test.mjs` validates all nine shipped browser-icon, logo and store PNGs beyond header dimensions: PNG chunk bounds, chunk CRCs, required chunks, 8-bit RGB/RGBA encoding, compressed image streams, decoded scanline lengths and filter byte ranges.
- Complete local Node suite: **157/157 PASS** (`node --test tests/*.test.mjs`, Node.js v22.16.0).
- This is source/artifact verification only, not visual pixel verification in Chrome; the owner's manual browser waiver remains in effect.

## Browser acceptance - explicitly waived

**The project owner explicitly opted to skip manual browser acceptance on November 12, 2026. The following checklist remains unexecuted and informational only.**

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

## Minimal runtime archive (2026-11-12)

- `python tools/package_runtime.py <output.zip>` packages only the manifest and runtime-owned `src/`, `_locales/`, and `icons/` directories, with no new extension dependencies.
- Runtime archive validation verifies the manifest references, ZIP CRCs and exact member list. Development files stay in the complete project ZIP.
- Neither the runtime archive nor its checks establishes actual Chrome or Chrome Web Store acceptance. See `docs/RELEASE-PACKAGING.md`.

## Reproducible runtime packaging verification (2026-11-12)

- `python -m unittest discover -s tests -p 'test_runtime_packaging.py' -v`: **3/3 PASS** locally, covering identical archive bytes, rejected in-runtime output and rejected symlinked runtime directory.
- `node --test tests/*.test.mjs`: **157/157 PASS** locally.
- `node tests/release-check.mjs`: **PASS** locally.
- Runtime packaging uses stable entry ordering, timestamps and metadata, verifies exact file contents, and does not add extension dependencies.
- Browser acceptance remains explicitly waived and was not executed.

## Runtime allowlist hardening (2026-11-12)

- `node --test tests/*.test.mjs`: **157/157 PASS**.
- `python -m unittest discover -s tests -p 'test_runtime_packaging.py' -v`: **4/4 PASS**, including hidden/backup-file exclusion regression.
- `node tests/release-check.mjs`: **PASS**.
- These tests validate source and packaging only; real browser behavior and store acceptance remain unverified by user choice.

2026-11-12: 157 Node.js tests and 5 Python packaging tests pass. Runtime HTML script/stylesheet dependencies and manifest localization placeholders are validated before packaging. Browser acceptance deliberately skipped.

2026-11-12: 157/157 Node.js tests plus 7/7 Python packaging tests. Static release check passed. New coverage: missing packaged relative ESM import and missing Chrome-injected script. Manual Chrome acceptance remains explicitly waived.

## 1.18.1 - History deletion UX

- `node --test tests/*.test.mjs` exercises the existing suite and new history confirmation checks.
- `python -m unittest discover -s tests -p test_runtime_packaging.py` verifies runtime packaging.
- `node tests/release-check.mjs` checks release structure.
- The confirmation handler is verified statically and through localized string presence; actual Chrome modal behavior is not browser-tested.
- Manual Chrome acceptance remains explicitly excluded.
