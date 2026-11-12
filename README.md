<div align="center">

# SCREENSHOT

### Capture precisely. Edit locally. Export instantly.

[![Version](https://img.shields.io/badge/version-1.18.3-3b82f6?style=flat-square)](manifest.json)
[![Manifest](https://img.shields.io/badge/Chromium-Manifest%20V3-64748b?style=flat-square)](manifest.json)
[![License](https://img.shields.io/badge/license-MIT-16a34a?style=flat-square)](LICENSE)
[![Browser acceptance](https://img.shields.io/badge/browser%20acceptance-pending-f59e0b?style=flat-square)](TESTING.md)

**Five capture modes · Local PNG editing · Searchable history · Five languages**

</div>

> [!IMPORTANT]
> **Current source candidate: v1.18.3.** Automated Node and static checks passed for this source, but real Chrome/Edge extension and operating-system clipboard acceptance, browser-store review and publication are **not verified**. See [TESTING.md](TESTING.md).

## Features

| Area | Capability |
| --- | --- |
| Capture | Select a region, DOM element, visible tab, whole page or native window-sharing target |
| Editor | Crop, pan, zoom, rectangles, arrows, pen, text, blur, pixelate, resize/move annotations, undo and redo |
| Workflow | Automatic original PNG clipboard attempt, edited PNG copy/download, optional automatic save, new capture directly from editor |
| History | Search, rename, favorite, filter, reopen, delete and export local screenshots; storage-size display |
| Preferences | 0/3/5/10-second delay, history limit up to 100 entries, up to 30 days, export filename prefix and save-location chooser |
| Localization | Automatic or manual German, English, French, Italian and Spanish; locally bundled translations |
| Design | Light/dark theme, responsive popup and editor, keyboard controls, reduced-motion and high-contrast support |

### What's new in 1.18.3

- Undo up to five recently deleted screenshots in reverse order within the current popup session. Each deletion remains recoverable until five newer deletions push it out; the previous delete confirmation remains replaced by a recovery action. Clearing the entire history still requires confirmation.

### Previously in 1.18.2

- Added a session-only history Undo control for the latest deleted screenshot.

### Previously in 1.18.1

- **Safer history deletion:** deleting a single saved capture now requires confirmation. The prompt is available in all five supported languages; cancelling leaves stored data unchanged.

### Previously in 1.18.0

- **Faster history filtering:** typing in the search field or toggling favorites filters the current popup snapshot without repeatedly loading all stored PNG data from disk.
- **Safer asynchronous updates:** obsolete overlapping history refreshes cannot overwrite a newer result; a history action cannot be triggered repeatedly while it is pending.
- **Improved search and validation:** accent-insensitive search and stricter capture-name input validation.
- **Consolidated source:** includes all 1.13.0 through 1.17.0 changes. See [CHANGELOG.md](CHANGELOG.md) for the release progression.

## Install

1. Download this repository as a ZIP from GitHub, or run `git clone https://github.com/jsmlabs/SCREENSHOT.git`.
2. Extract the archive if necessary and open `chrome://extensions` or `edge://extensions`.
3. Enable **Developer mode**, select **Load unpacked**, and choose the directory containing `manifest.json`.
4. Open an ordinary HTTP(S) page and choose a capture mode from the extension popup.

To update an existing unpacked extension, replace the installed source directory with the new project files and press **Reload** in the extensions manager. Avoid copying arbitrary project ZIPs *inside* the extension directory. The repository source is not a Chrome Web Store release.

### Capture and editing

- **Area:** drag a selection; `Esc` cancels. **Element:** point at an element to select its visible portion.
- **Visible tab:** capture the current viewport. **Full page:** scroll and stitch with size, layout-change and cancellation safeguards. **Window:** choose a window in Chromium's permission picker.
- **Editor:** annotate or crop non-destructively, copy the edited PNG, save full-resolution output, or select **New capture** to preserve the existing preview and open another editor window.
- **Keyboard:** `V` pan, `S` select, `C` crop, `R` rectangle, `A` arrow, `P` pen, `T` text, `B` blur, `I` pixelate. `Ctrl+Z` undo; `Ctrl+Y` / `Ctrl+Shift+Z` redo. Configure browser capture shortcuts at `chrome://extensions/shortcuts`.

### History and privacy

Screenshots are stored as PNG data URLs in `chrome.storage.local`, along with local settings. No source code in this version implements cloud uploads, user analytics or external screenshot processing. The history holds up to **100 entries**. Favorites survive age expiry but still count toward the configured item cap; deleting/clearing history removes the corresponding records. Cleanup is opportunistic, not a guaranteed background job.

> [!WARNING]
> Blur and pixelation are visual obfuscation, **not secure redaction**. They must not be relied upon to remove confidential content from an image before sharing it.

### Permissions

`activeTab`, `scripting`, `tabs`, `storage`, `unlimitedStorage`, `offscreen`, `clipboardWrite` and `downloads` support the capture and local export workflow. The manifest does **not** request broad `host_permissions` or `externally_connectable`. Browser-protected pages (`chrome://`, Web Store surfaces, etc.) cannot be captured with standard extension APIs.

## Architecture

| Path | Responsibility |
| --- | --- |
| `manifest.json`, `_locales/`, `icons/` | Chromium manifest, extension metadata translations, and icons |
| `src/background/` | MV3 service worker and capture orchestration |
| `src/capture/` | Capture planning, validation, page-injected selection, and recovery |
| `src/popup/` | Capture controls, history, and preferences |
| `src/editor/` | Editing, preview, rendering, and export |
| `src/offscreen/` | Local PNG composition |
| `src/shared/` | Localization, clipboard, message policy, preferences, and CSS |
| `tests/` | Node regressions, release checks, and optional browser tests |
| `docs/archive/` | Historical reports and release tooling |

Load the repository root in Chrome or Edge as an unpacked extension. No runtime dependencies or build step are required.

## Updating a Git checkout on Windows

Run `GIT-PULL.bat` from the checkout. It updates the current branch from its configured upstream with a fast-forward only. Switch to `main` first to update the local `main` branch. The script requires Git and a clean working tree, including untracked files. For a ZIP installation, download and extract an updated copy instead.

## Development and verification

Requires **Node.js 20+** for unit tests; no `npm install` is necessary.

```bash
node --test tests/*.test.mjs
node tests/release-check.mjs
```

Check JS syntax with `node --check` on application and test `.js`/`.mjs` files. Optional browser scripts in `tests/browser_*.py` require Python, Playwright and a Chromium installation; they do not replace manual Chrome/Edge permission, window-picker and clipboard checks. See [TESTING.md](TESTING.md) for exact current evidence and remaining acceptance gates.

## Limitations and rollback

- Full-page stitching on dynamic sites or nested scroll containers is best-effort. Image dimensions, memory, and browser `captureVisibleTab` rate limits can prevent completion.
- OS policy can deny focus, clipboard writes or screen-sharing consent. A rendered image does not prove clipboard integration worked.
- Large PNG histories can consume considerable storage; faster filtering avoids *repeated* reads while the popup remains open, but its first load still reads local image records.
- Browser interaction, visual layout and accessibility still require validation on actual Chrome/Edge installations.
- To roll back, reinstall the prior unpacked version after backing up desired PNGs. Older code may ignore recent metadata or prune favorites under earlier retention rules.

## Project documentation

- [Changelog](CHANGELOG.md) - version progression and compatibility
- [Testing and release gates](TESTING.md) - current checks and outstanding host validation
- [Historic engineering evidence](docs/archive/) - archived reports and earlier release candidates
- [MIT license](LICENSE)

---

<div align="center">SCREENSHOT · Local-first capture and editing · © 2026 JSM</div>
