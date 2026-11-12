# SCREENSHOT — Phase 06 Security, Performance & Release

Date: 2026-11-11. Status: **Release Candidate, NOT final browser-approved production release**.
Base: SCREENSHOT Phase 05 ZIP, Manifest V3 v1.9.0. No manifest version bump: browser acceptance remains blocked.

## Changes made
- `offscreen.js`: Full-page tile images are now decoded and released sequentially, rather than retaining all decoded bitmaps simultaneously. The existing pixel geometry and seam planner remain unchanged. Bitmap dimensions are checked on each tile, and bitmaps are closed even on rendering errors.
- `background.js` and `editor.js`: Fresh captures carry `fresh=1` into their preview URL. Optional auto-save is attempted only on a newly captured image; reopening an image from history does not trigger another download. Automatic clipboard copy on preview remains unchanged.
- Added security/regression assertions and updated legacy source-contract checks.
- No new runtime dependencies, permissions, remote resources, telemetry, network endpoints or external upload features.

## Evidence / reproducible commands
- `node --test tests/*.test.mjs`: **102 passed / 0 failed**.
- `node tests/release-check.mjs`: **PASS** (static manifest/security validation).
- `node --check` on all root `*.js` and `*.mjs`: **PASS**.
- ZIP integrity (`ZipFile.testzip()`): **PASS**.
- Every one of the 57 files from Phase 05 remains present.
- Synthetic CPU-only geometry benchmark: 10,000 fullTilePlan computations on 30 tiles took 28.4 ms under Node 22.16.0 in this environment. This is **not a capture speed benchmark**, and does not establish performance gains on a browser/device.
- Mocked sequential decoding regression verifies peak simultaneously open bitmaps = 1 versus up to N in the former implementation. Actual GPU/heap peak reduction was not measured in a real browser.

## Permission and trust-boundary audit
- Manifest permissions retained unchanged: `activeTab`, `scripting`, `tabs`, `storage`, `unlimitedStorage`, `offscreen`, `clipboardWrite`, `downloads`. The `downloads` permission serves the optional user-enabled auto-save; broad `tabs` permission is retained pending real-browser permission-reduction testing, rather than introducing unverified compatibility changes.
- No `host_permissions` or `externally_connectable`; no remote scripts or dynamic code evaluation were found in inspected source.
- Privileged worker commands remain restricted to extension-owned popup URL. Offscreen composition accepts the worker sender and validates tile dimensions, mode and data budget. Selection messages require source tab/main frame. These are source and mocked regression checks, not penetration tests.
- PNG data and history remain local in `chrome.storage.local`; the configured history cleanup happens opportunistically, not under a guaranteed background timer. Users should use **Clear history** for immediate removal.

## Browser gates — NOT VERIFIED / BLOCKED
1. `python tests/browser_e2e.py`: BLOCKED; Chromium started but no extension service worker appeared before 12-second timeout in sandbox. Thus no real capture/clipboard/download/shortcut proof.
2. `python tests/browser_ui.py`: BLOCKED by `net::ERR_BLOCKED_BY_ADMINISTRATOR` for localhost navigation.
3. `python tests/browser_quick_edit.py`: BLOCKED by `net::ERR_BLOCKED_BY_ADMINISTRATOR` for localhost navigation.
4. Windows + Chrome/Edge manual test: NOT RUN. Must check all five capture modes, Auto-Clipboard with Ctrl+V into external application, page restoration on failed/cancelled full-page capture, Retina/DPI, editor annotation export, user-enabled Auto-Save exactly once, history reopen without download, retention/deletion, shortcut capture, and large-page memory use.
5. Actual Chrome Web Store packaging/signing/publication: NOT RUN / NOT REQUESTED. ZIP is an unpacked extension project, not a signed CRX.

## Install / manual acceptance
1. Extract the ZIP into a new directory and open `chrome://extensions` / `edge://extensions`.
2. Enable Developer mode and choose **Load unpacked**, selecting the folder containing `manifest.json`.
3. Confirm the five capture modes; use the popup and `chrome://extensions/shortcuts` for commands.
4. Confirm PNG auto-copy in a real application, and opt-in Auto-Save behaviour. Enable auto-save and take one screenshot: expect one download. Reopen the same item from history: expect no new download.
5. Test a tall webpage, failed capture, cancellation, page scroll/style restoration and different DPI settings.
6. If regression occurs, remove/reload this unpacked folder and load the preserved Phase 05 ZIP instead. Existing `chrome.storage.local` records are not automatically migrated or rolled back.

## Final release decision
**HOLD** pending real extension browser acceptance. Node regression and static release checks pass; do not describe the build as Windows/Edge end-to-end verified.
