<div align="center">

# SCREENSHOT

### Capture precisely. Edit locally. Export instantly.

**Five capture modes · Built-in editor · Five interface languages · Local-first PNG workflow**

[![Version](https://img.shields.io/badge/version-1.12.0-3b82f6?style=flat-square)](manifest.json)
[![Chrome](https://img.shields.io/badge/Chromium-Manifest_V3-64748b?style=flat-square)](manifest.json)
[![License](https://img.shields.io/badge/license-MIT-16a34a?style=flat-square)](LICENSE)
[![Validation](https://img.shields.io/badge/browser_acceptance-pending-f59e0b?style=flat-square)](TESTING.md)

[Get started](#get-started) · [Captures](#capture-modes) · [Editing](#editor) · [Languages](#languages) · [Development](#development) · [Troubleshooting](#troubleshooting)

</div>

---

> [!IMPORTANT]
> **Current source build: v1.12.0.** Local verification: 116/116 Node tests, static release check and JS syntax checks passed on 2026-11-12, but full interactive Chrome/Edge acceptance and Chrome Web Store publication remain **unverified**. See [TESTING.md](TESTING.md) for historical tests and release gates.

## Overview

SCREENSHOT is a lightweight, dependency-free Chromium extension for capturing webpage regions, individual elements, visible tabs, full pages, or a browser-selected window. Every capture opens in a separate preview editor where it can be annotated, cropped, copied, and downloaded as PNG. The extension stores captures and user settings locally, without screenshot cloud uploads, analytics, or third-party UI frameworks.

**Capture → Preview → Edit → Copy / Save.** You can also launch another capture directly from the editor without discarding the original image.

## What's new

| Version | Feature | Details |
| :-- | :-- | :-- |
| **1.12.0** | **New capture from the editor** | Opens a mode picker for all five modes, restores the original source tab when available, and keeps the existing editor open. [Details](NEW-CAPTURE-1.12.0.md) |
| **1.11.0** | **Five-language UI** | Detects browser language or lets you select German, English, French, Italian, or Spanish. All translations are bundled locally. [Details](LOCALIZATION-1.11.0.md) |
| **1.10.0** | **Consumer UI refinement** | Refined capture controls, responsive editor, consistent interface copy and contextual errors. [Details](CONSUMER-RELEASE-1.10.0.md) |

## Get started

### Requirements

- Desktop **Google Chrome**, **Microsoft Edge**, or a compatible Chromium browser supporting Manifest V3.
- Permission to load an unpacked extension.
- No dependencies or build tools required for normal use.

### Install

1. Download this repository as a ZIP from **Code → Download ZIP**, or clone it:
   ```bash
   git clone https://github.com/jsmlabs/SCREENSHOT.git
   ```
2. Extract the ZIP if applicable.
3. Open `chrome://extensions` or `edge://extensions`.
4. Enable **Developer mode**, click **Load unpacked**, and select the folder containing `manifest.json`.
5. Pin the extension if desired, open a normal HTTP(S) webpage, and select a capture mode.

To update an existing unpacked installation, replace the source files **in its installed directory**, then click **Reload** in the extensions manager. This repository has no verified Chrome Web Store release.

## Capture modes

| Mode | Capture target | Important behavior |
| :-- | :-- | :-- |
| **Area** | A drawn rectangle | Drag to select; `Esc` cancels. |
| **Element** | Visible DOM element | Only the viewport-visible portion is captured. |
| **Visible tab** | Current tab viewport | Captures the content currently on screen. |
| **Window** | Window selected through browser picker | Requires explicit `getDisplayMedia` permission. |
| **Full page** | Scrollable webpage | Scroll-and-stitch capture with bounds and layout checks. |

The optional capture timer supports **0, 3, 5, and 10 seconds**. Full-page capture uses tile geometry calculated from actual bitmap dimensions and attempts to restore the original page position and temporary DOM changes. Dynamic layouts, animation, lazy loading, sticky components, and nested scrolling can disrupt full-page stitching.

### New capture without leaving the editor

Click **New capture / Neu aufnehmen** in the editor header, select one of the five modes, and take another screenshot. SCREENSHOT attempts to return to the original source web tab (or another active HTTP(S) tab for older history items). Your existing editing window and image remain unchanged; successful new captures open in a separate editor window. See [v1.12.0 design notes](NEW-CAPTURE-1.12.0.md).

## Editor

Capture previews open as independent resizable windows. Editing is non-destructive while the window is open, with undoable annotation and crop actions.

| Tool | Shortcut | What it does |
| :-- | :-- | :-- |
| Hand | `V` | Pan and move the viewport |
| Select | `S` | Select, reposition, and modify existing annotations |
| Crop | `C` | Crop to a rectangle |
| Rectangle | `R` | Draw outlined boxes |
| Arrow | `A` | Emphasize a direction or detail |
| Pen | `P` | Draw freehand |
| Text | `T` | Insert editable text |
| Blur | `B` | Blur a selected region |
| Pixelate | `I` | Pixelate a selected region |
| Remove | `Delete` | Delete selected annotation |

Additional shortcuts: `Ctrl+Z` undo; `Ctrl+Y` or `Ctrl+Shift+Z` redo; `0` fit image; `1` 100% zoom; `+` / `-` zoom; `Esc` hand tool. The editor supports wheel zoom, pan, configurable color and stroke strength, and exporting the **edited full-resolution PNG** independent of preview zoom. Editing history does not survive window closure.

> [!WARNING]
> Blur and pixelation **are not secure redaction**. Do not depend on these effects to remove confidential data from images before distribution.

## Clipboard, saving, and history

- **Automatic copy:** After the original image renders and the preview is focused, SCREENSHOT attempts to write the original PNG to the clipboard. Browser/OS policy may delay or deny this operation. A success status is shown only after a successful write.
- **Manual copy:** **Copy / Kopieren** copies the **edited** PNG. Manual copying cancels a pending original-image copy to prevent overwriting the edited result.
- **Manual save:** **Save PNG / PNG speichern** downloads the edited image at its original image resolution.
- **Automatic download:** Optional and **off by default**. Downloads an original image when newly captured; history reopening should not auto-download again.
- **History:** Stores original screenshots in `chrome.storage.local`; the settings allow **5, 10, or 20 captures** and **1, 3, or 7 days** of retention. Entries can be reopened or deleted; cleanup occurs when captures are published or the popup opens rather than at a guaranteed scheduled time.
- **Capture shortcuts:** Assign visible-tab and full-page shortcuts at `chrome://extensions/shortcuts`. Neither is enabled by default.

## Languages

SCREENSHOT bundles five interface languages:

| Language | Code |
| :-- | :-- |
| Deutsch | `de` |
| English | `en` |
| Français | `fr` |
| Italiano | `it` |
| Español | `es` |

The default **Automatic** setting uses preferred browser languages and falls back to English when unsupported. Open **Settings → Language** to select a language manually. Regional variants such as `de-CH` use the base language. The popup updates immediately; the editor applies the selected language when reopened. Chrome extension metadata is translated through `_locales` and `default_locale`. Some browser error messages and detailed system status text can remain untranslated. No network-based translation service is used.

## Privacy and permissions

Capture data and preferences are kept in the extension's local browser storage. There is no implemented cloud screenshot synchronization, remote telemetry, or third-party analytics in this source snapshot. Clipboard writes and downloads are explicitly supported workflows, and installing the extension grants the following browser API permissions:

| Permission | Why it is used |
| :-- | :-- |
| `activeTab` | Capture the selected active tab |
| `scripting` | Run selection/capture helpers in allowed pages |
| `tabs` | Coordinate tab selection and navigation |
| `storage` | Store preferences and local capture history |
| `unlimitedStorage` | Support large locally stored PNGs |
| `offscreen` | Image composition and cropping |
| `clipboardWrite` | Write PNGs to the clipboard |
| `downloads` | Optional auto-save and manual PNG export |

The manifest does not request blanket `host_permissions` or `externally_connectable`. For a security review with validation scope, see [PHASE-06-RELEASE-REPORT.md](PHASE-06-RELEASE-REPORT.md).

## Architecture

```text
popup.html / popup.js              User controls, settings, history
        |
        v
background.js                     Manifest V3 capture orchestration
        |-- selection.js           Rectangle selection
        |-- element-selection.js   DOM element selection
        |-- capture-*.mjs          Lifecycle, fidelity, validation
        |-- offscreen.js           Crop and full-page image composition
        +-- chrome.storage.local   Capture data, preferences, history
                    |
                    v
editor.html / editor.js           Preview, editing and new capture
        |-- edit-*.mjs             Editing model, objects and rendering
        |-- new-capture.mjs        Repeat-capture logic
        +-- i18n.mjs / locales.mjs  Localized interface strings

_locales/                          Chrome manifest localization
style.css                          Shared dark/light design system
tests/                             Node and optional browser checks
```

**Design choices:** Standard HTML/CSS/JavaScript modules, Chrome Manifest V3, native browser APIs, no JavaScript dependency installation, local-first image processing, bounded capture resources, and a responsive dark/light UI.

## Development

### Automated verification

Requires **Node.js 20+** (for development only):

```bash
node --test tests/*.test.mjs
node tests/release-check.mjs
```

Optional browser harnesses require Python, Playwright, and Chromium:

```bash
python tests/browser_e2e.py
python tests/browser_ui.py
python tests/browser_quick_edit.py
```

**Verified on the uploaded v1.12.0 archive for this synchronization:** **116/116 Node tests passed** and the release-structure check passed, executed with Node.js 22.16.0. These checks do **not** validate actual Chrome capture interactions, system clipboard, DPI behavior, or Chrome Web Store readiness. Browser acceptance remains an open release gate; consult [TESTING.md](TESTING.md) for scope and historical checks.

### Windows Git publishing

The project also uses `COMMIT-PUSH.bat` for a guided Git workflow with a colorized terminal, repository validation, staged-change review, commit prompt and explicit push confirmation. If you are working from an extracted ZIP, you must connect its files to an actual Git working tree rather than assuming the archive includes `.git`. Always review additions **and deletions** before committing, particularly when reconciling extracted archives with existing GitHub history. No force-push is required or recommended.

Manual workflow:

```bash
git status
git add -A
git diff --cached
git commit -m "Describe the change"
git push origin main
```

## Limitations

- Restricted browser pages (such as `chrome://` and `edge://`) cannot be captured using ordinary extension APIs.
- Full-page captures can fail on dynamic pages or produce layout artifacts; pixel size, height, and memory budgets are enforced.
- Selected HTML elements are limited to their visible area, with cross-origin frame and some shadow DOM restrictions.
- OS/window picker consent and clipboard permissions depend on the environment.
- Source-image editing history is per window, not persisted in the stored screenshot history.
- Blur/pixelation are not a cryptographic or guaranteed privacy-protecting redaction mechanism.

## Troubleshooting

<details><summary><strong>Extension is not available in the toolbar</strong></summary>

Check that you selected the directory containing `manifest.json`, enabled Developer mode, and used **Load unpacked** in your browser's extensions page. Reload it after a source update and pin it if desired.

</details>

<details><summary><strong>Cannot capture the selected tab</strong></summary>

Try a normal HTTP(S) webpage; internal or browser-protected pages are unsupported. Cancel active selections and review the popup status and extension errors before retrying.

</details>

<details><summary><strong>Automatic clipboard copy did not occur</strong></summary>

Focus and interact with the preview, then try the manual Copy button. Confirm actual success by pasting into a native application. Browser permissions may prevent background clipboard access.

</details>

<details><summary><strong>Full-page screenshot has seams or fails</strong></summary>

Wait for dynamic loading to settle, avoid animated pages, and retry. Scrolling, changing layout bounds, and nested scroll containers may prevent a reliable stitch.

</details>

<details><summary><strong>COMMIT-PUSH.bat reports Git/remote problems</strong></summary>

Verify that Git for Windows is installed; inspect `git status` and `git remote -v`. If the repository is extracted from a ZIP, connect to a proper Git clone while preserving existing local files. Never force-push an unreviewed state.

</details>

## Project documentation

- [v1.12.0: New capture](NEW-CAPTURE-1.12.0.md)
- [v1.11.0: Localization](LOCALIZATION-1.11.0.md)
- [v1.10.0: Consumer polish](CONSUMER-RELEASE-1.10.0.md)
- [Test records and outstanding release gates](TESTING.md)
- [Security/performance release review](PHASE-06-RELEASE-REPORT.md)
- [Earlier release candidate notes](docs/archive/RELEASE-CANDIDATE.md)

## License

Released under the **[MIT License](LICENSE)**. Copyright © 2026 JSM.

---

<div align="center">

**SCREENSHOT** · Capture precisely. Edit locally. Export instantly.

[Repository](https://github.com/jsmlabs/SCREENSHOT) · [Issues](https://github.com/jsmlabs/SCREENSHOT/issues) · [License](LICENSE)

</div>
