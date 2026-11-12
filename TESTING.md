# SCREENSHOT v1.12.0 - Verification (2026-11-12)

- Verified locally: `node --test tests/*.test.mjs` - **116 passed, 0 failed**.
- Verified locally: `node tests/release-check.mjs` - **PASS**.
- Verified locally: `node --check` for root JavaScript modules - **PASS**.
- This evidence applies to the reconciled v1.12.0 source package, not a GitHub release or a signed Chrome Web Store distribution.
- Real Chrome/Edge extension captures, system clipboard, window sharing, localization rendering and manual E2E acceptance remain **unverified**.

---

> **v1.11.0:** 112 automated tests passed; locale-specific Chrome UI acceptance still requires manual verification.

# Historical verification - 1.10.0

Automated checks: `node --test tests/*.test.mjs` and `node tests/release-check.mjs`. Full runtime acceptance in a locally installed Chrome extension is still required. Older checklists below describe prior release candidates.

## Phase 06 latest validation

102/102 Node tests, static release check and JS syntax checks pass. Browser E2E remains blocked; see PHASE-06-RELEASE-REPORT.md.

# Phase 05 verification addendum (2026-11-11)

- Baseline: Phase 04 complete ZIP, 55 files. Existing public capture, clipboard and editor entry points preserved.
- Added: local persisted settings with bounded validation, opt-in original PNG download, 5/10/20 entry local history with reopen/delete/clear, configurable retention, Chrome-managed capture keyboard commands for visible/full.
- Permission change: `downloads` added for reliable opt-in Auto-Save. No host-wide access, remote scripts or new runtime libraries. Two Chrome commands have no default keys; users assign keys in `chrome://extensions/shortcuts`.
- Automated checks: `node --test tests/*.test.mjs` (100/100), JavaScript syntax and release-structure checks, package member and CRC validation. No assertion of live extension interaction.
- Manual gates: Chrome/Edge install, full capture in all modes, native download confirmation, auto-save off/on, key assignment, history reopen/delete/clear and retention, original PNG clipboard behavior, complete editing workflows, service-worker interruption.
- Rollback: reload the unpacked extension from `SCREENSHOT-Phase-04-Advanced-Image-Editor.zip`; prior preferences/history keys can remain in local storage, so delete extension storage if complete rollback of data is desired.

---

# Phase 04 verification addendum (2026-11-11)

- Baseline: Phase 03 full ZIP; 53 source files retained.
- Implemented: selectable/movable/deleteable annotations, editable text and properties, blur/pixelate regions in source-pixel render path, shortcuts and responsive toolbar actions.
- Tests: `node --test tests/*.test.mjs` (95 passed, 0 failed); `node --check` on JS/MJS sources; `node tests/release-check.mjs` (passed). ZIP integrity and baseline retention checked during packaging.
- Chromium: isolated HTML/CSS editor rendered at 1100px and 420px; no horizontal toolbar overflow. The full navigable browser UI test fails with `net::ERR_BLOCKED_BY_ADMINISTRATOR` for localhost; it is NOT claimed to pass. Real Chrome/Edge extension interaction, capture, clipboard and effects visual validation remain unverified.
- Caution: blur/pixelation are visual obfuscation, not guaranteed sensitive-data redaction.
- Rollback: restore `SCREENSHOT-Phase-03-Capture-Engine-2.0.zip` and reload the unpacked extension.

---

# Phase 03 (2026-11-11) - Capture Engine 2.0

## Automated evidence

- PASS: `node --test tests/*.test.mjs`: **89/89** (Phase 02 baseline: 83/83).
- PASS: `node tests/release-check.mjs` and `node --check` for every JS/MJS module.
- PASS: final ZIP CRC/integrity and package membership verification.
- Regression cases: scroll anchoring, viewport resize, page expansion, sideways scroll, cumulative PNG payload limits, watchdog restore after simulated service-worker disappearance, and no-op after normal cleanup.
- Existing capture, clipboard, editing and UI contract suites remain green.
- NOT VERIFIED: real Chromium extension capture E2E, full-page visual pixel comparisons, OS clipboard, recovery under actual MV3 suspension and Chrome background timer throttling.

## Real-browser acceptance gates (still open)

1. Capture a long static page at 100%, 125%, 150% and 200% display scale; check 1:1 output dimensions and absence of lines/seams.
2. Test fixed/sticky headers: appear once at top, not repeated; verify the page is visually unchanged after capture.
3. Capture pages that lazy-load content or shift layout while scrolling. A stable page must complete; changing geometry must produce a visible error instead of corrupted stitching.
4. Cancel during scrolling, close the source tab, and forcibly terminate/reload the service worker. Check eventual cleanup and the ability to capture again. Be aware that browser background throttling may delay watchdog execution.
5. Re-run all five capture modes, Ctrl+V clipboard paste, editor tools and light/dark popup checks from the prior phases.
6. Test tall/wide pages above defined capture bounds: clear failure and no stale overlays, storage entries or hanging capture state.

---

## Phase 02 UI acceptance checks

- [x] 83 Node tests (includes Phase 01 regressions and 3 Phase 02 UI contract tests).
- [x] Rendered standalone Chromium popup HTML/CSS in dark and light modes: all five entries visible.
- [x] Rendered standalone Chromium editor HTML/CSS in 1040px and 400px windows; shortcut details open and responsive controls present.
- [x] JavaScript syntax and release structure checks.
- [ ] Real extension runtime browser E2E on Windows/Chrome/Edge (not performed).
- [ ] Keyboard-only/a11y assistive technology testing in real extension (not performed).
- [ ] Windows clipboard and OS window focus behavior (not performed).

# Phase 01 (2026-11-11) - Capture & Clipboard Reliability

## Verified against this updated build

- PASS: `node --test tests/*.test.mjs`: **80/80** tests. Baseline: 77/77.
- PASS: `node tests/release-check.mjs` (release structure/security contract).
- PASS: `node --check` on every JS/MJS source and test.
- PASS: ZIP path and integrity validation after packaging.
- Coverage added: `SecurityError` retry, denial without an uncontrolled retry loop, cancellation of in-flight writes without false success.
- Capture flow: auto-copy is now scheduled only after source PNG decode **and** successful editor preview image load. Focus, visibility, pointer and keyboard events permit bounded retries.
- NOT VERIFIED: actual Windows OS clipboard paste, focus behavior, native window picker, and all five real Chrome capture modes. These require an interactive Chrome/Edge session on the target OS.

## Manual acceptance checks

1. Capture area, element, visible tab, full page and shared window; paste PNG with Ctrl+V into Paint. Compare visible pixel content and dimensions.
2. Confirm `Automatisch kopiert` only after a successful write. Revoke clipboard permission and confirm a visible blocked message and availability of manual copy and PNG download.
3. Return focus / click / press a key in the preview to retry a blocked write; confirm one attempt per activation and no spin.
4. Edit a screenshot, press `Kopieren`, paste edited PNG and verify that any pending automatic write does not subsequently restore the unedited PNG.
5. Start a second screenshot and verify the newest capture's PNG; test rapid repeats and cancelled selection/full-page operations.

---

# SCREENSHOT - UI 3.0 / Clipboard Verification (2026-11-08)

Current candidate version: manifest `1.9.0` (not published; version unchanged pending browser acceptance).

- **PASS:** 74/74 Node tests, including focused/deferred clipboard, competing captures and clipboard error behavior.
- **PASS:** Source-contract tests retain all capture modes and editor actions.
- **BLOCKED:** Actual Chromium popup screenshot: `net::ERR_BLOCKED_BY_ADMINISTRATOR` for local `file://` navigation.
- **NOT VERIFIED:** Windows Chrome clipboard paste, OS focus management, window picker and real extension browser E2E.

## Required manual acceptance before release

1. Install unpacked build and take each of area / element / visible / full-page / window captures.
2. For each capture, confirm the editor shows **Automatisch kopiert** only after the PNG was successfully written; paste into Paint (`Ctrl+V`). Compare dimensions.
3. Start a capture while another preview is open, verify that the newer image remains in the clipboard.
4. Refocus an unfocused preview: pending copy should complete without needing a manual click on Copy.
5. Reject clipboard permission and confirm visible error; manual Copy and Save must remain usable.
6. Check popup at 100%, 125% and 150% display scale with dark and light OS themes; five capture actions, delay, status and cancellation must be visible/operable.
7. Verify editor window layout at 520x590, maximized and narrow widths; check every tool, crop, annotation, undo/redo, zoom, Save and Copy.
8. Validate source scroll restoration on full-page capture and cancellation/retry for selection modes.

---

# SCREENSHOT - Verification record (through v1.7.0)

## Automated verification in this build environment

- **PASS:** `node --test tests/*.test.mjs`: **38/38** tests.
- **PASS:** Syntax check of all JavaScript and ES modules with `node --check`.
- **PASS:** ZIP integrity and archive path validation.
- **PASS (mocked):** Worker capture-to-preview path: distinct screenshot keys, create popup, explicit focus request, sequential captures.
- **PASS:** Pure geometry invariant tests at 10%, 50%, 100%, 200%, 332% and 800% zoom: neither small images nor oversized images cross the 6px inner clipping viewport.
- **BLOCKED:** Real extension browser E2E: Linux headless Chromium launched but did not expose the extension service worker within the test deadline (12s). No real capture/area/window/full-page E2E claim can be made.
- **BLOCKED:** Standalone Chromium preview UI test: Browser navigation returned `net::ERR_BLOCKED_BY_ADMINISTRATOR` for local HTTP and `file://`. Therefore real client rendering was not confirmed.
- **NOT RUN:** Windows foreground activation and OS window picker verification. These require a Windows Chromium session.

## Quick Edit verification

- **PASS:** Edit history, nested crop coordinates, rectangle normalisation, clamping, bounded undo history, undo/redo branching and deep-copy isolation (Node tests).
- **PASS:** Renderer crop pixel dimensions, source-to-crop coordinate translation, rectangle/arrow/pen/text rendering calls, invalid crop rejection (Node tests with a fake Canvas context).
- **PASS:** Static package checks ensure editing controls, renderer and original capture entry points remain present.
- **BLOCKED:** Actual Chromium UI interaction test (`python tests/browser_quick_edit.py`): browser navigation returned `net::ERR_BLOCKED_BY_ADMINISTRATOR`, also after an attempted route-mocked HTTPS navigation.
- **NOT VERIFIED:** Actual screenshot export pixels, clipboard writes and edit interaction in Chrome. Run the supplied browser UI script in an unrestricted environment and then follow the Windows manual checklist.

## Manual Windows Chrome checklist

1. [ ] Visit `chrome://extensions`, load/unpack current v1.4 directory, confirm version `1.4.0` and no load errors.
2. [ ] Visible-tab capture: check popup gets focus and original 1:1 pixel dimensions are correct.
3. [ ] Area selection: choose rectangle; verify cropped PNG; Esc cancels, then next capture works; tiny region cancels cleanly.
4. [ ] Full page: test tall ordinary webpage; inspect seams; verify scroll position restored **before** preview appears.
5. [ ] Capture twice: each preview must show the correct individual screenshot, including after refreshing a preview.
6. [ ] Window mode: native picker opens; selected window is captured after user consent; cancellation shows error without crash.
7. [ ] Zoom with pointer, +/-; Fit, 1:1; pan at all four edges; test small and large images at 100% and 332%.
8. [ ] With image smaller than preview, ensure 6px minimum visible inset from outline (no image outside frame).
9. [ ] With image larger than preview, drag to all extremes: clipping remains exactly within 6px inset and no empty interior gap is exposed.
10. [ ] Resize/maximize preview during zoom/pan, check geometry and keyboard pan after clicking preview.
11. [ ] Save PNG and compare original dimensions; copy image and paste into an external app.
12. [ ] Disable clipboard permission or cancel a picker; error should be visible, extension remains usable.
13. [ ] Test browser-protected URL; extension should show a clear actionable error, not silently fail.
14. [ ] Verify the popup gets foreground focus after area, visible and full-page captures on Windows; repeat from a different window.
15. [ ] Check dark/light appearance and narrow popup controls; no overlap or hidden buttons.

16. [ ] Draw rectangle, arrow and freehand pen; test several colors and one text annotation.
17. [ ] Crop, undo crop, redo crop. Verify source pixel dimensions after saving the PNG.
18. [ ] Crop a second time after the first crop; confirm source coordinates remain correct.
19. [ ] Undo an edit, then add a new annotation; confirm redo history is cleared.
20. [ ] Confirm Copy exports the *edited* result while pan and zoom never change the saved image dimensions.
21. [ ] Test Ctrl+Z / Ctrl+Y, Ctrl+Shift+Z and Escape; inspect narrow-window button wrapping.

## Known risks

- Headless test policy prevents end-to-end verification in this environment.
- `chrome.windows.update({focused:true})` does not override system restrictions.
- Full-page capture is a scroll-and-stitch method, not a browser-native whole-page screenshot.
- Very large PNG data can require high memory use; unsupported limits return an error preview.

## v1.5 Smart Capture verification

- PASS: Node-based capture-plan tests for timer options, invalid delay input, element selection geometry clamping, deterministic tile planning and pixel limits.
- PASS: Package-level integration checks for element picker overlay/cancellation, timer routing, module worker declaration, full-page scroll/style restoration and preserved editing tools.
- BLOCKED: Chromium extension E2E could not obtain an extension service worker (Playwright 12-second timeout). See `SCREENSHOT-v1.5.0-browser-e2e.txt` in the build environment.
- BLOCKED: Chromium preview test navigation blocked with `net::ERR_BLOCKED_BY_ADMINISTRATOR`. See `SCREENSHOT-v1.5.0-browser-preview.txt` in the build environment.
- NOT VERIFIED: End-to-end Chrome capture flow, actual OS window focusing, browser-window picker, selection overlay appearance and full-page image stitching on real-world pages.

### Additional manual acceptance checklist

1. [ ] Open v1.5 popup; verify **Element** mode and timer options 0/3/5/10 sec.
2. [ ] Hover visible elements: blue overlay must follow the targeted element; select a nested component and verify resulting PNG bounds.
3. [ ] Press Escape during element selection; retry successfully. Test a very small/invisible element.
4. [ ] Select timer 3 sec for visible capture; verify the screenshot is taken after the delay (not when clicking capture).
5. [ ] Select timer 5 sec for area and element; verify the delay happens after choosing the target and no overlay appears in the result.
6. [ ] Select timer 3 sec for Window; verify timer starts after picker consent.
7. [ ] Full-page capture with a sticky header: appears once at the first tile, not repeated; viewport/scroll state restored.
8. [ ] Full-page capture with a footer and non-multiple-of-viewport page height: bottom of output is complete and no blank seams.
9. [ ] Full-page capture with dynamic content: errors are shown clearly if scroll position is inconsistent; check for artifacts on lazy-loaded sites.
10. [ ] Existing preview at 100/332%, pan bounds, 6px gap, crop/annotation/undo/redo, save and copy all still work.
11. [ ] Repeat captures; newly created popup requests focus and previews keep their own image.

## v1.6 stability verification

- Unit/state tests: lifecycle exclusivity, invalid transitions, cancellation during timers, blocked browser request deadlines and retry after cancellation.
- Capture regression: simulated visible screenshot produces distinct PNG-backed records and focused popup windows.
- Package: local Manifest V3 entrypoints, v1.6 capture-state APIs, cancel UI, existing crop/annotation and full-page handling.
- Required real-browser acceptance tests (not implied by Node unit tests):
  1. Start 10-second delayed capture. Reopen popup, cancel, and verify no preview opens and the next capture works.
  2. Start full-page capture, reopen popup, cancel mid-scroll, and verify original scrolling and hidden page elements are restored.
  3. Select area and element, Escape, then immediately start a new capture.
  4. Close source tab during capture, then attempt a capture from a different tab.
  5. Start two capture requests quickly and verify exactly one starts.
  6. Verify zoom/pan at 100%/332%, fixed 6px inset, Crop/Undo/Redo, PNG save and Copy.
  7. Verify popup focus on Windows, repeated shots, error previews, and native window picker.

Browser End-to-End runs must be performed in a Chromium environment that supports loading unpacked extensions; previously this environment did not permit extension service worker/UI navigation. Manual Windows smoke testing is required before a stable release.

## v1.7 Capture Fidelity test record

- `node --test tests/*.test.mjs`: **52/52 PASS** (includes fractional scaling, overlapping tiles, seam continuity, crop pixel rounding, inconsistent sizes and simulated offscreen drawing/bitmap cleanup).
- JavaScript syntax: see build verification, all scripts/modules checked using `node --check`.
- ZIP integrity: checked after archive creation.
- Browser E2E: **BLOCKED** in this environment. `python tests/browser_e2e.py` timed out waiting for an extension service worker (12 seconds); no real Chrome screenshot is verified.
- Windows Chrome / Edge manual verification: **NOT RUN**.

### Required manual acceptance for v1.7

1. Capture a full page at Chrome 100%, 125% and 150% zoom; compare PNG width, page bottom and content alignment.
2. Test a tall static page whose height is not divisible by viewport height. Inspect every join for duplicated/missing rows, especially the bottom overlap.
3. Test sticky header and fixed utility bar; verify they do not repeat in lower tiles and styles/scroll position are restored after success, error and cancellation.
4. Test Windows DPI scaling at 100% and 150%, changing browser window sizes between sessions; verify no horizontal stretching.
5. Test a page that changes viewport size during capture: error rather than a corrupt image.
6. Recheck visible tab, area and element captures; compare saved PNG pixel bounds to chosen region. Test editor Crop/Undo/Redo and copied PNG.
7. Confirm each new capture opens an individual focused popup; verify pan 6px inset, zoom and resize.

## v1.8 validation checklist

- Capture visible, area, element, window and full-page screenshots; confirm preview remains floating and focused where OS allows.
- Use zoom/pan at 100%, 332%, 800%, with the 6px clipping gap; double-click in hand mode to fit.
- Draw a rectangle at 200%, undo and redo without unexpected viewport reset; Crop should fit new dimensions.
- Change stroke width 2/4/8/12 px and export at different preview zoom levels; source-image stroke widths should match.
- Verify `V/C/R/A/P/T` shortcuts work when viewport focused but not while typing text or using inputs.
- Verify pointer cancellation leaves no annotation, and rapid edits preserve valid exports.
- `node --test tests/*.test.mjs` is the offline suite; run `python tests/browser_quick_edit.py` in an unrestricted Chrome/Chromium environment for UI interactions.

## v1.9 Release Candidate verification

Run `node --test tests/*.test.mjs` and `node tests/release-check.mjs`.

Additional manual release-candidate cases (requires Chrome and Edge on Windows):

- On an HTTP(S) page run all five modes; check separate focused preview and correct output.
- Trigger back-to-back visible captures and verify each preview displays its own data.
- Cancel delayed captures and selection; ensure no stale popup appears afterward.
- Pan to every 6px boundary at Fit, 100%, and 332% and resize the preview.
- Draw each annotation type, crop, undo and redo; compare saved PNG and clipboard with preview at 100%.
- Full-page capture: test a static test page, sticky header, lazy-loaded images, DPR 1, 1.25, 1.5 and 2.
- Test release extension reload between capture and preview opening; no unexpected cross-capture data.
- Inspect extension permissions and confirm there are no remote endpoints used.
- Close tab during capture; check that status recovers and temporary DOM changes are cleaned up where feasible.

Browser tests are distinct from mocked Node tests. No stable release claim is justified by static or simulated checks alone.

## Automatic PNG clipboard - verification checklist

- Node regression: run `node --test tests/*.test.mjs`. Covers PNG clipboard MIME, offscreen composition and focused-editor clipboard request, error propagation, package permission and the existing capture lifecycle.
- Manual Chrome (Windows): for area, element, visible and full-page, take each capture and immediately paste into an image-capable application (Ctrl+V). Confirm original PNG is present before pressing **Kopieren**.
- Manual Chrome (Windows): share a window, capture, then paste immediately. Confirm window mode also copies automatically.
- Edit the screenshot, press **Kopieren**, paste and verify the edited version replaces the original clipboard image.
- Temporarily deny or otherwise interrupt clipboard access: screenshot preview must still open and show a specific warning instead of falsely claiming success.
- Capture twice in sequence: clipboard must contain the most recent completed capture. Check permissions after extension update.
- Actual OS clipboard writing and browser permissions require a real Chrome extension session; Node mocks are not proof of system clipboard behavior.

## UI 2.0 follow-up (November 2026)

- PASS: `node --test tests/*.test.mjs`: 68/68 tests, including UI contract checks.
- PASS: JavaScript syntax checks and ZIP integrity (see generated release package).
- NOT RUN: Verified Windows Chromium capture and clipboard paste; requires user browser/OS access.
- Manual acceptance: open `popup.html` from an unpacked extension in Chrome; compare dark/light UI, five mode buttons, timer, cancel and status. Capture each mode, paste PNG with Ctrl+V into an external image editor, verify output dimensions, check failures and manual Copy. Confirm popup remains at 340px without clipping and editor controls remain usable at 450px and 900px window widths. Also confirm keyboard focus, 6px viewport inset and zoom/annotation rendering.
