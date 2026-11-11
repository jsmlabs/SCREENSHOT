# Current build: SCREENSHOT 1.10.0

This ZIP contains the consumer-facing German UI polish release. See `CONSUMER-RELEASE-1.10.0.md` for current changes and outstanding browser/store acceptance. Historical development notes below refer to previous builds and are preserved for traceability.

## Phase 06 — Security, Performance & Release (RC)

See [PHASE-06-RELEASE-REPORT.md](PHASE-06-RELEASE-REPORT.md) for changed files, verified checks, browser blockers, install steps and rollback. The Chrome/Edge release gate remains **HOLD**.

# SCREENSHOT v1.9.0 - Phase 05 Productivity & Configuration (unreleased working build)

Small, dependency-free Chrome/Chromium Manifest V3 screenshot extension.

## Install

1. Extract the ZIP archive.
2. Visit `chrome://extensions`, enable **Developer mode**.
3. Choose **Load unpacked** and select the extracted folder containing `manifest.json`.
4. Pin SCREENSHOT if desired, open an ordinary HTTP(S) webpage, and choose a capture mode.

To upgrade, replace the files in the already loaded directory and press **Reload** on the extension card. Previous screenshot previews may need to be reopened after an update.

## Capture modes

- **Bereich**: draw a rectangle on the current page, Escape to cancel.
- **Sichtbarer Tab**: capture the currently visible webpage.
- **Element**: select a visible HTML element from the page, or press Escape to cancel.
- **Ganze Seite**: scroll the webpage and stitch the visible tiles; original scroll position is restored before the preview is shown.
- **Fenster**: ask the browser to share a window from a separate preview popup; user must explicitly grant permission.

Each capture opens its own resizable **popup window** rather than a browser tab. `chrome.windows.create({focused:true})` followed by `chrome.windows.update(...,{focused:true})` requests foreground focus, subject to OS policy.

## Automatic clipboard copy

- Every successfully decoded and preview-rendered **area, element, visible-tab and full-page** capture automatically writes its original PNG to the system clipboard *from the preview after it receives focus*.
- **Window** capture also automatically copies the selected window PNG once acquired.
- The manual **Kopieren** button remains available to copy the current **edited** image. Changes made after capture are not automatically copied again.
- If the preview is not focused, copying remains pending until the preview receives focus. Clipboard writes are serialized; when a second capture arrives during a write, the newest capture is written last and only its success is reported. The editor reports success only after `navigator.clipboard.write()` resolves. Browser permission denials (NotAllowedError/SecurityError) remain pending and retryable on later focus, click or keyboard interaction, without an automatic retry loop; other clipboard failures leave the screenshot editable. Use **Kopieren** to retry manually. Manual copy cancels any pending automatic copy so the edited PNG is not subsequently replaced.
- Chrome may ask to approve the new `clipboardWrite` extension permission after upgrading. Clipboard availability is browser/OS-dependent.

## Phase 05 - Productivity & Configuration

- **Einstellungen** in the capture popup persist locally under `settings:v1`. Timer (0/3/5/10 seconds), optional PNG auto-save (OFF by default), screenshot history size (5/10/20) and retention (1/3/7 days) are configurable. Bad stored values fall back to bounded defaults.
- **Auto-Save:** when enabled, the original PNG is downloaded automatically after the preview renders, using `chrome.downloads.download` into the default browser downloads directory. Downloads use unique timestamped filenames. The edited PNG is still saved separately on demand via **PNG speichern**. The new `downloads` permission is required for reliable automatic downloading.
- **History:** the popup lists locally stored captures with mode and timestamp; open, delete individually, or clear all with confirmation. Images remain inside `chrome.storage.local`. Automatic pruning happens when a new capture is published or the popup is opened. Old images can still occupy storage until one of those events. No cloud integration is introduced. Stored captures are originals, not in-progress editor changes.
- **Capture keyboard shortcuts:** register *Sichtbaren Tab aufnehmen* and *Ganze Seite aufnehmen* commands in Chrome's own shortcuts manager: `chrome://extensions/shortcuts` (also linked from Einstellungen). Neither is assigned a default hotkey to avoid system conflicts. Existing editor keyboard shortcuts remain unchanged.
- Five modes, automatic clipboard, Phase 02 responsive themes, Phase 03 capture integrity, and Phase 04 advanced editor are preserved. Native Windows/Edge/Chrome extension capture, downloads, clipboard and keyboard shortcut acceptance still require interactive testing.

## Phase 04 - Advanced Image Editor

- **Auswahl (S):** click an annotation to select it; drag to reposition it. Selection uses source-image coordinates and respects existing crop offsets. Topmost overlapping annotation takes precedence.
- **Entfernen / Delete:** remove the selected annotation as an undoable operation.
- **Text ändern:** select a text annotation and edit its content, or double-click a text annotation in selection mode. New and edited text remains limited to 200 characters.
- **Farbe / Stärke:** when an annotation is selected in Selection mode, changing color or stroke width updates that annotation and creates an undoable history entry. Otherwise the settings apply to future annotations.
- **Blur (B) / Pixel (I):** drag a rectangular region to add a blur or pixelation effect. Strength derives from the existing width picker. Effects are editable objects, drawn in annotation order, rendered into the same PNG used for preview, download and manual clipboard copy. **These visual effects are not a security-grade redaction mechanism** for sensitive secrets.
- All edit objects remain non-destructive: the original image pixels and original PNG auto-copy are preserved. Undo/redo supports create, move, modify, remove, crop and reset.
- Existing capture modes, auto clipboard, Phase 02 interface and Phase 03 capture recovery remain in place; no added dependencies or permissions. The manifest remains 1.9.0 because the working build is not published.
- Verification: 95/95 Node tests, JavaScript syntax, release structure, ZIP integrity, static desktop/mobile Chromium UI render. A live navigation-based Chromium editor test is blocked by administrator policy, so actual mouse editing, PNG effect rendering and operating-system clipboard interaction require manual Chrome/Edge acceptance.

## Phase 03 - Capture Engine 2.0

- Validates full-page scroll position, viewport dimensions, and total page dimensions **after each 650 ms settling interval** to reject scroll anchoring, layout shifts, and lazy-loaded growth instead of silently stitching misaligned tiles.
- Full-page jobs have a 120-second budget (checked between tiles); snapshots and image composition keep their existing bounded browser-request timeouts.
- Preserves pre-existing page attributes that happen to use the floating-element marker; only extension-marked (`capture`) fixed/sticky elements are hidden on subsequent tiles and removed during cleanup.
- Adds a page-owned 125-second watchdog that attempts to restore scroll position, scroll behavior and extension-owned temporary DOM changes after an unexpected service-worker shutdown. Chromium background-timer throttling may delay this recovery; navigation or tab closure disposes the page automatically.
- Rejects cumulative image payloads exceeding 128 million encoded characters before image composition; the existing physical pixel bounds and PNG checks remain.
- The tile composer still determines pixel mapping from actual captured bitmap sizes (rather than assuming devicePixelRatio), rejects inconsistent resolutions and paints non-overlapping strips to avoid seam overdraw.
- Manifest permissions, capture modes and Phase 01 clipboard behavior / Phase 02 interface are unchanged. The unpublished working build retains manifest `1.9.0` pending real-browser acceptance.

## Phase 02 - Modern GUI / UI / UX

- Reworked capture-first popup with distinct vector icons, clear titles and descriptions, a visible timer and Auto Clipboard indicator, and semantic busy/error feedback.
- Refined editor header, annotation toolbar, grouped controls, zoom controls, live status, and compact Shortcut help, retaining the 6px preview inset.
- Theme-aware dark/light colors, responsive layout for narrow editor windows, accessible names on icon-only buttons, visible focus outlines and reduced-motion support.
- UI shell was rendered and inspected in Chromium using isolated HTML/CSS with no extension APIs (popup dark/light, editor desktop/mobile). Full browser navigation to local HTTP preview was denied by administrator policy; real extension capture, OS clipboard and editor runtime end-to-end remain unverified.
- No new runtime dependencies, permissions, capture modes, or data handling changes. Manifest version remains 1.9.0 because this is an unpublished working iteration; do not treat it as a published upgrade.

## Preview

- Mouse wheel: cursor-anchored zoom, 10% to 800%.
- Drag: pan; the image stays bounded inside the **6 CSS pixel inset** preview frame at every zoom level.
- `+`, `-`: zoom in or out when focus is not in a button or input.
- `0`: Fit, `1`: 100% original size; arrow keys pan.
- **Kopieren** writes the edited PNG into the clipboard.
- **PNG speichern** downloads the edited PNG in source-pixel resolution, regardless of zoom.
- Resize and maximize are supported. Fit adapts to resize; manual zoom clamps to new boundaries.

## Quick Edit v1.4

Quick Edit is integrated into the floating preview; the capture methods and popup behavior from v1.3 remain.

- **Hand**: drag to pan; mouse wheel zooms in any tool.
- **Crop**: drag a region of the image; release to commit the crop. Crop resets the view to Fit and switches back to Hand.
- **Rechteck / Pfeil / Stift**: drag to annotate, using the selected color. The image itself remains unmodified until exported.
- **Text**: click in the image and enter text in the browser prompt (200 characters maximum).
- **Undo / Redo**: `Ctrl+Z` and `Ctrl+Y` (or `Ctrl+Shift+Z`); buttons also work, and history includes crop and annotations. `Escape` returns to Hand.
- **Original**: returns to the original image as a new undoable operation.
- The original capture stays in memory; edit history is limited to 60 states per preview window. No edits are persisted after closing the window.
- Save and copy both export the **edited**, full-resolution PNG. Preview zoom and pan never affect the exported resolution.

**Limitations:** Crop is rectangular; drawn annotations are rasterized during export. There is no move/delete tool for individual annotations, editable typography panel, or persistent edit history. Extremely large captures may fail canvas encoding due to browser memory limits.

## Reliability changes in v1.3

- Each capture uses a random UUID and dedicated `chrome.storage.local` key rather than shared `latestCapture` state; preview reload remains possible until cleanup.
- Phase 05 captures use configurable retention (1/3/7 days) and history limits (5/10/20) instead of the previous fixed bounds. Pruning happens on new capture or popup open; expired items might remain in local storage until then. Screenshots do not leave the browser extension.
- Only one capture/selection starts at a time; Escape and tiny selection cancellation release the selection lock.
- Source-page scroll restoration precedes focus request for full-page previews.
- 6px viewport geometry is explicit and shared by Fit, Zoom, Dragging and Resize.
- Loading, capture errors, window-picker cancellation and clipboard failure have visible status messages.

## Technical limits

- Browser-internal and protected pages, including `chrome://`, are unsupported.
- Full-page capture is best effort: dynamic pages may now fail with a clear layout-change error instead of a broken image; animations, lazy loading, scroll-driven effects and nested scroll containers can still produce artifacts.
- Full-page capture rejects horizontal overflow and images estimated above 80 million physical pixels or 32,000px height. The actual browser canvas limit may be lower.
- Browser `captureVisibleTab` rate limits and memory constraints vary by Chrome version and OS.
- Window capture uses `getDisplayMedia`, requires manual picker consent, and may vary with Chromium/browser permissions.
- Windows/Chromium foreground restrictions can prevent automatic focus even after both focus requests.
- Local browser test coverage here does not demonstrate operation on a user's Windows machine.

## Tests

Unit/integration (requires Node.js 20+):

```bash
node --test tests/*.test.mjs
```

Optional real Chromium extension capture smoke test (requires Python Playwright and a Chromium installation):

```bash
python tests/browser_e2e.py
```

Optional real Chromium preview UI test with mocked extension storage:

```bash
python tests/browser_ui.py
python tests/browser_quick_edit.py
```

The last two are exploratory tests requiring local browser launches. Check `TESTING.md` for the precise environment-specific verification status and hands-on checklist.

## Smart Capture v1.5

- **Element**: In the popup choose **Element**, move over an HTML element to see a blue outline, click to capture only its visible viewport intersection, or press Escape to cancel. Elements extending beyond the viewport are cropped to the visible area, not reconstructed by scrolling. Pages using cross-origin frames/shadow roots can limit selection granularity.
- **Timer**: In the popup select **Sofort**, **3**, **5**, or **10 Sekunden** before starting any mode. For area/element capture the delay begins **after selecting the target** and the overlay is removed before capture. For window capture, the delay begins after the native browser window picker is confirmed. There is no visible countdown overlay.
- **Full page**: tile positions are calculated deterministically, including the final overlapping tile; each requested scroll coordinate is checked against the actual position and viewport. Fixed/sticky elements present at scan time are hidden from subsequent tiles to reduce repeated headers/overlays, then restored together with the original page scroll state before the floating preview opens. The full capture still rejects horizontally overflowing pages and excessive dimensions.
- Capture preview, Quick Edit, crop, annotation tools, undo/redo, clipboard, PNG export, independent capture IDs and focus requests remain available.

### Smart Capture limitations

- Element capture is of the **visible portion** of the selected DOM element. Browser-protected pages, inaccessible frame content and some shadow trees cannot be selected individually.
- Scroll stitching is best effort. Changing content, lazy loading, CSS transforms, nested scroll areas, animated widgets and complex sticky interfaces may produce artifacts; dimensions/scroll changes may now fail explicitly rather than silently misaligning the image.
- Sticky/fixed elements are suppressed after the first full-page tile, which may also hide legitimately repeated section headers on complex sites. Page styles/scroll position are restored in a `finally` cleanup; if the tab is closed or navigated during capture, cleanup cannot run.
- Timer is not a screenshot video recorder. Page content can change while waiting. Chrome may restrict the source tab or picker while switching windows.

### v1.5 test commands

```bash
node --test tests/*.test.mjs
# Optional, needs unrestricted Chromium + Playwright:
python tests/browser_e2e.py
python tests/browser_quick_edit.py
```

See `TESTING.md` for environment verification and manual checklist.

## Reliability v1.6

- A single capture lifecycle (`idle -> selecting -> capturing -> composing -> publishing -> idle`) rejects overlapping operations and invalid transitions.
- Reopen the extension popup while an area, element or full-page capture is active to see the state and use **Aufnahme abbrechen**. Cancelled captures do not intentionally open an error preview. Cancellation is cooperative and cannot preempt an already-completed browser screenshot call.
- The selection session is bounded to 120 seconds while the service worker stays alive. Tab close or Escape releases the lock. A service worker restart resets its in-memory state; Chrome MV3 does not guarantee timer continuity across restarts.
- Browser screenshot API requests have a 20-second limit; offscreen image composition has a 45-second response limit. These are app-level timeouts, not forced cancellation of browser internals.
- Full-page capture restores scroll position, scroll-behavior overrides, and sticky-element markers in `finally` after failures and cancellation when the tab remains scriptable.
- The screenshot ID, local-only preview window, editor crop/annotations, undo/redo, clipboard and full-resolution PNG export are preserved.
- **Known restriction:** `window` mode uses native `getDisplayMedia` in a separate preview and cannot be cancelled via the background lifecycle. Focus requests remain OS-dependent. An interrupted MV3 worker may leave an injected selection overlay until the user presses Escape or reloads the page.

## v1.7 Capture Fidelity

The v1.7 full-page composer uses the **actual captured PNG pixel dimensions** to compute the CSS-to-image scale rather than assuming `devicePixelRatio`. Each tile is painted as a distinct source strip bounded by the next tile's scroll position, so overlapping bottom tiles do not overwrite earlier pixels or duplicate sticky page elements already suppressed by the capture worker. All tile boundaries use rounded **absolute pixel edges**, avoiding incremental rounding drift. Full-page composition rejects inconsistent bitmap sizes/scales, gaps and invalid positions. Captured bitmaps are closed in `finally` even when composing fails.

Area/element crops use independently rounded pixel edges. Visible-tab/window behavior, floating preview, 6px inset, editor, copy/save, timers and cancel flows remain unchanged. Horizontal overflow and dynamic / scrolling DOM content remain unsupported or best-effort. Full-page capture is a scroll/stitch process, not a pixel-perfect DOM renderer.

## v1.8 Preview & Edit Polish

- Tool shortcuts: `V` hand, `C` crop, `R` rectangle, `A` arrow, `P` pen, `T` text. Shortcuts do not hijack form inputs or controls; `Esc` returns to hand.
- Undo/redo: `Ctrl+Z`, `Ctrl+Shift+Z` and `Ctrl+Y` (also `Cmd` on macOS); annotation-only changes preserve the exact zoom/pan view. Crop changes re-fit the view.
- Fixed annotation stroke widths in source-image pixels: 2, 4, 8 or 12 px, independent of preview zoom, to keep exports predictable.
- Mouse-wheel units are normalised (pixel/line/page), avoiding extreme jumps on trackpads; double-click the hand-mode preview to fit.
- Preview toolbar has larger click targets, accessible focus rings and compact responsive styling.
- Known limitation: source-image rendering still uses PNG data URLs and can consume substantial memory for extremely large captures.

## v1.9.0 Release Candidate

- Hardened internal message authorization: popup-only privileged commands, top-frame selection callbacks from the active selection tab, background-worker-only offscreen image composition.
- Validated image composition contracts: supported mode, finite positive dimensions, tile count, PNG data URL syntax, and crop dimensions.
- Added negative security tests and a reproducible release check (`node tests/release-check.mjs`).
- Updated the visible popup version. Capture, preview, editing and export functionality are preserved.
- **Not yet a stable release:** actual Chrome/Edge tests on Windows, cross-display scaling checks, and full-page screenshots on dynamic pages remain release gates.

## UI 2.0 refresh (November 2026)

- Capture popup and preview editor now share a single compact design system, with native OS dark/light appearance, high-contrast focus outlines, and responsive tool layouts.
- Capture modes, timer, cancel action, automatic PNG clipboard copy, manual edited-image copy, zoom/pan and editing retain their existing behavior and IDs.
- The UI presents clipboard state in the preview status message; clipboard failures remain actionable without discarding the image.
- The UI refresh replaces legacy appended CSS overrides rather than layering more overrides.
- Browser/OS rendering and actual Windows clipboard pasting require manual verification; Node tests only confirm static contracts and mocked behavior.
