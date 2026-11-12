<div align="center">

# SCREENSHOT

### Capture precisely. Edit locally. Export instantly.

A lightweight Chromium screenshot extension with five capture modes, a built-in image editor, automatic clipboard support, and local screenshot history.

[![Version](https://img.shields.io/badge/version-1.10.0-3b82f6?style=flat-square)](manifest.json)
[![Manifest](https://img.shields.io/badge/Chrome_Manifest-V3-64748b?style=flat-square)](manifest.json)
[![License](https://img.shields.io/badge/license-MIT-16a34a?style=flat-square)](LICENSE)
[![Release status](https://img.shields.io/badge/status-browser_validation_pending-f59e0b?style=flat-square)](TESTING.md)

**[Install](#get-started)** · **[Capture](#capture-modes)** · **[Editor](#image-editor)** · **[Architecture](#architecture)** · **[Development](#development)** · **[Troubleshooting](#troubleshooting)**

</div>

---

> [!IMPORTANT]
> **Version distinction:** The public `main` branch currently contains **v1.10.0** (`manifest.json`). A separate **v1.12.0** project snapshot has been prepared with localization and a new capture workflow, but those files **have not yet been pushed to GitHub**. The version badge above deliberately reflects the installable source on `main`, not the pending update. Real Chrome/Edge end-to-end acceptance and Chrome Web Store publication are still unverified. See [TESTING.md](TESTING.md) and the [release report](PHASE-06-RELEASE-REPORT.md).

## Overview

SCREENSHOT provides a focused screenshot workflow inside Chromium-based browsers:

**Choose a target → Capture → Preview and edit → Copy or save PNG**

The currently published source uses a German-language interface, respects light/dark appearance, and processes screenshots locally rather than uploading them to an application cloud service. The codebase is built with native browser APIs and JavaScript modules, without a runtime package manager or external UI framework.

### At a glance

| | Capability | What it does |
| :-- | :-- | :-- |
| 01 | **Area** | Draw a rectangle around part of a webpage |
| 02 | **Element** | Select an HTML element's visible area |
| 03 | **Visible tab** | Capture the portion currently in view |
| 04 | **Window** | Choose a window using the browser's native sharing picker |
| 05 | **Full page** | Scroll and stitch a webpage into a single image |
| | **Image editor** | Crop, annotate, blur, pixelate, zoom, undo, and redo |
| | **PNG workflow** | Attempt automatic original-image clipboard copy; manually copy or download edited PNGs |
| | **Local productivity** | Capture timer, opt-in auto-save, local history, and configurable shortcuts |

### Upcoming project version: 1.12.0 (not yet on `main`)

The separately prepared v1.12.0 snapshot extends the current feature set:

| Version | Addition | Availability |
| :-- | :-- | :-- |
| **1.10.0** | German-language consumer interface and core screenshot/editor workflow | On GitHub `main` |
| **1.11.0** | Multi-language localization and language detection | Prepared locally, not pushed |
| **1.12.0** | Start a new screenshot capture from the existing editor | Prepared locally, not pushed |

**Do not assume that downloading this repository currently installs 1.12.0.** After the newer project files have been synchronized and verified on GitHub, update the version badge, installation details, and release status against the actual contents of `manifest.json`.

## Get started

### Requirements

- A Chromium-based desktop browser with Manifest V3 extension support, such as **Google Chrome** or **Microsoft Edge**.
- Permission to install an **unpacked extension** in the browser.
- No Node.js, build process, or npm install required for normal use.

### Install from GitHub

1. Download the repository using **Code → Download ZIP**, or clone it:
   ```bash
   git clone https://github.com/jsmlabs/SCREENSHOT.git
   ```
2. If using a ZIP, extract it into a permanent folder.
3. Open `chrome://extensions` in Chrome or `edge://extensions` in Edge.
4. Turn on **Developer mode**.
5. Select **Load unpacked** / **Entpackte Erweiterung laden**.
6. Select the directory containing **`manifest.json`**, then optionally pin SCREENSHOT to the toolbar.
7. Open a normal HTTP(S) webpage and choose a capture mode.

> [!NOTE]
> The extension is **not** installed by opening `popup.html` directly. Chrome/Edge must load the directory through its Extensions page. Browser-internal and other protected pages cannot be captured by regular extension APIs.

### Update an existing unpacked install

Replace or update the files in the **same installed extension directory**, then click **Reload** on the extension card. Existing previews may need to be reopened. Do not assume saved local storage is removed by reloading.

## Capture modes

| Mode in the UI | Use it for | Notes |
| :-- | :-- | :-- |
| **Bereich** (Area) | Custom sections, charts, or page details | Drag to select; `Esc` cancels |
| **Element** | Cards, panels, components, or visible DOM elements | Captures the element's **visible viewport intersection**, not offscreen content |
| **Sichtbarer Tab** (Visible tab) | Current webpage view | Captures the visible tab area |
| **Fenster** (Window) | A browser-selected window | Requires explicit native picker consent through `getDisplayMedia` |
| **Ganze Seite** (Full page) | Long webpages and documentation | Scroll/stitch capture, subject to dynamic-page and size limits |

**Full-page accuracy:** The engine calculates output geometry from actual captured bitmaps, validates tile positions and dimensions, and attempts to restore the original scroll position and temporary page changes. This is a best-effort screenshot stitcher, **not** a pixel-perfect DOM renderer; animation, lazy loading, nested scrolling, sticky UI, or layout shifts can cause artifacts or a visible capture failure.

### Capture delay

Select **Sofort**, **3**, **5**, or **10 Sekunden** in the popup. For selection-based captures, the delay starts after the target is selected; for window capture, it starts after the native picker is confirmed. There is no on-page countdown overlay.

## Image editor

Each successful capture opens in a separate resizable preview window. Editing is non-destructive in the current session: the original screenshot is preserved while the editor maintains an undoable series of changes.

### Tools

| Tool | Action | Shortcut |
| :-- | :-- | :-- |
| Hand | Pan around the image | `V` |
| Selection | Select and move an annotation | `S` |
| Crop | Trim the image to a rectangle | `C` |
| Rectangle | Outline an area | `R` |
| Arrow | Point to a detail | `A` |
| Pen | Draw freely | `P` |
| Text | Add or edit a text note | `T` |
| Blur | Blur a rectangular region | `B` |
| Pixelate | Pixelate a rectangular region | `I` |
| Remove selection | Delete selected annotation | `Delete` |

Other controls:

- **Undo:** `Ctrl+Z`; **Redo:** `Ctrl+Y` or `Ctrl+Shift+Z` (also Command equivalents on macOS).
- **Fit:** `0`; **1:1 zoom:** `1`; **zoom in/out:** `+` / `-` when no input or button has focus.
- **Mouse wheel:** Zoom toward the cursor; drag in Hand mode to pan; double-click in Hand mode to fit.
- **Esc:** Return to Hand mode.
- Annotation color and 2/4/8/12 px stroke width can be changed; selected annotations can be moved, changed, or removed.

**Export:** **Kopieren** copies the **edited** PNG; **PNG speichern** downloads the **edited** PNG at image resolution, independently of the current preview zoom. Current-session editor history is limited and does not persist after closing the preview.

> [!WARNING]
> **Blur and pixelation are visual effects, not guaranteed secure redaction.** Do not rely on them alone to remove passwords, credentials, personal information, or other secrets before sharing an image.

## Clipboard, downloads, and history

### Clipboard behavior

SCREENSHOT attempts to copy the **original PNG** automatically after a successfully rendered capture preview has focus. The operation can be deferred by browser focus or permission restrictions. A successful status is shown only after the clipboard API resolves.

If automatic copying is blocked, refocus or interact with the preview or use **Kopieren** manually. Manually copying the edited image cancels pending original-image auto-copy so that a later retry does not unexpectedly replace it. Clipboard permissions and cross-application paste behavior depend on the browser and operating system.

### Settings

The popup's **Einstellungen** panel offers:

| Setting | Values | Default behavior |
| :-- | :-- | :-- |
| Capture delay | 0 / 3 / 5 / 10 seconds | Immediate |
| Automatic PNG download | On / off | **Off** |
| Maximum history entries | 5 / 10 / 20 | Configurable |
| History retention | 1 / 3 / 7 days | Configurable |
| Capture shortcuts | User-selected browser shortcuts | **No preassigned shortcut** |

Auto-save downloads the original capture, not subsequent edits. Reopening an item from history is not intended to trigger another automatic download. Use **PNG speichern** to export the edited result separately.

History stores original captures locally via `chrome.storage.local`; items can be reopened, deleted individually, or cleared. Expired captures are pruned when new captures are published or the popup is opened, **not necessarily at the exact expiry time**. In-progress annotations are not stored in history.

Capture shortcuts for **visible tab** and **full page** are assigned through `chrome://extensions/shortcuts` (also linked from the popup).

## Privacy and permissions

SCREENSHOT does not implement a cloud screenshot service, third-party telemetry, or remote upload in the inspected project. Captured PNGs and retained history are stored in the browser's local extension storage; users can export images explicitly through the clipboard and downloads.

The current `manifest.json` requests the following permissions:

| Permission | Purpose |
| :-- | :-- |
| `activeTab` | Access the user-selected active tab for captures |
| `scripting` | Inject selection/capture helpers into permitted pages |
| `tabs` | Coordinate source tabs and capture windows |
| `storage` | Persist capture data, history, and preferences |
| `unlimitedStorage` | Support local image-history storage beyond small default quotas |
| `offscreen` | Compose/crop screenshot images in an offscreen document |
| `clipboardWrite` | Copy PNG images to the clipboard |
| `downloads` | Save PNGs, including optional automatic downloads |

The manifest does not declare `host_permissions` or `externally_connectable`. Permission names describe API access, **not** a guarantee of browser approval on every page. For the recorded security review and validation limitations, see [Phase 06 release report](PHASE-06-RELEASE-REPORT.md).

## Architecture

```text
Browser toolbar popup
  popup.html / popup.js
        |
        v
  background.js             MV3 service worker / capture orchestration
        |
        +-- selection.js    Area selection
        +-- element-selection.js
        +-- capture-plan.mjs / capture-fidelity.mjs
        |
        +-- offscreen.html / offscreen.js
        |       Image decoding, cropping and full-page stitching
        |
        +-- chrome.storage.local
        |       Captures, preferences and history
        |
        +-- editor.html / editor.js
                Preview, image tools, PNG export and clipboard
```

Additional focused modules cover lifecycle control, capture integrity, message policy, image editing, clipboard flow, preferences, and viewport geometry. Styles are shared in `style.css`.

**Implementation principles:** Chrome Manifest V3, plain HTML/CSS/JavaScript, native browser APIs, locally stored captures, isolated capture sessions, bounded capture processing, and a single shared design system.

## Development

### Project structure

| Path | Responsibility |
| :-- | :-- |
| `manifest.json` | Extension metadata, permissions, commands, entry points |
| `popup.html`, `popup.js` | Capture choices, settings, status, history |
| `background.js` | Capture workflow and privileged extension coordination |
| `selection.js`, `element-selection.js` | On-page target selection |
| `offscreen.js` | Canvas composition and image processing |
| `editor.html`, `editor.js` | Preview and editor interaction |
| `edit-*.mjs` | Editing state, objects, rendering |
| `capture-*.mjs` | Capture planning, recovery, fidelity and validation |
| `clipboard*.mjs`, `preferences.mjs` | Clipboard and local settings logic |
| `style.css` | Popup/editor presentation and responsive layouts |
| `tests/` | Node checks and optional browser test harnesses |
| `COMMIT-PUSH.bat` | Interactive Windows Git publish helper |

### Run automated checks

**Node.js 20+** is required for the Node test suite (not for extension installation).

```bash
node --test tests/*.test.mjs
node tests/release-check.mjs
```

Optional browser harnesses require **Python, Playwright, and a Chromium installation**:

```bash
python tests/browser_e2e.py
python tests/browser_ui.py
python tests/browser_quick_edit.py
```

These browser tests depend on launching and controlling Chromium; they may be blocked by local policy or environment restrictions. See [TESTING.md](TESTING.md) before interpreting their results.

**Verification status:** The stored Phase 06 report records **102 passing Node tests, a passing static release check, and passing JS syntax checks** in its test environment. That is historical test evidence, **not a claim that those tests were rerun for this README update or that browser functionality was fully validated**. Chrome/Edge capture, OS clipboard paste, OS window focus, browser permissions, live editing, and real-device scaling still require manual acceptance.

### Git publish helper (Windows)

The optional `COMMIT-PUSH.bat` provides a colorized command-line interface for reviewing changes, staging, committing and pushing to `jsmlabs/SCREENSHOT`.

1. Install **Git for Windows** and configure GitHub authentication and commit identity.
2. Run `COMMIT-PUSH.bat` from the repository root.
3. Review the changed-file summary, enter a commit message, and confirm before publishing.

The helper can recover missing Git metadata and remotes, fetch recent GitHub history, and synchronize its local baseline without overwriting working files. It also blocks publication when the essential `.gitignore` or `LICENSE` files are missing. **Inspect every staged change**, especially deletions when connecting a ZIP folder to an existing remote history. An update to the script on GitHub does not automatically replace an older local copy.

If `git push` reports `fetch first`, do not force-push: update the local script, fetch the branch, inspect divergence and changes, and retry only after reconciling the history. A Git commit of the README alone does **not** publish the pending v1.12.0 code. Do not use this helper as a substitute for checking `git diff --cached`.

For a standard command-line workflow:

```bash
git status
git add -A
git diff --cached
git commit -m "Describe the change"
git push origin main
```

## Known limitations

- **Protected pages:** Chromium internal pages, restricted browser UI, and other prohibited URLs cannot be captured.
- **Element capture:** Only the visible portion is captured; cross-origin frames and some shadow DOM boundaries limit selection.
- **Full-page capture:** Scrolling pages can shift or load content. Dynamic layouts, sticky elements, animation, and nested scroll containers may degrade results or cause a deliberate failure.
- **Image size:** The capture engine enforces bounded dimensions (including documented 32,000 px height and 80 million physical pixels) and image-data budgets; browser canvas/memory limits may be lower.
- **Window selection:** The native sharing picker requires explicit user interaction and may behave differently across browsers/OSes.
- **Clipboard/focus:** Clipboard writes and foreground window requests can be denied or delayed by browser or OS policy.
- **Session editing:** Editor undo history does not persist in saved screenshot history.
- **Security:** Blur/pixelation should never be treated as a secure redaction mechanism.

## Troubleshooting

<details>
<summary><strong>SCREENSHOT is not visible after installation</strong></summary>

Check that you selected the directory containing `manifest.json`, enabled Developer mode, and used **Load unpacked**. Open the extension card to inspect errors and reload after updating files. Pin the extension from the browser toolbar if needed.

</details>

<details>
<summary><strong>Capture does not start on a page</strong></summary>

Try a regular HTTP(S) webpage rather than `chrome://`, `edge://`, a Web Store page, or another browser-protected URL. Inspect popup status text and extension errors. Cancel and retry if a selection is already active.

</details>

<details>
<summary><strong>Automatic clipboard copy did not happen</strong></summary>

Focus the preview, click or press a key, and retry with **Kopieren**. Browser clipboard permission and OS integration can block automatic writes. Confirm the result by pasting into an application such as Paint; a successful PNG preview alone does not prove clipboard access.

</details>

<details>
<summary><strong>Full-page image has seams or a layout error</strong></summary>

Retry on a stable page after content finishes loading. Animated regions, sticky headers, scroll-driven layout changes, and lazy-loaded content can break deterministic stitching. A visible error is preferable to silently exporting a corrupted composite.

</details>

<details>
<summary><strong>The Windows publish script reports Git or origin errors</strong></summary>

Download the **latest** `COMMIT-PUSH.bat` into the project root. Confirm Git is installed and review `git status` and `git remote -v`. The script can configure missing repository metadata/remote connections, but it must be allowed to do so and cannot replace GitHub authentication. If a push is rejected because the remote changed, inspect and reconcile the history instead of force-pushing.

</details>

## Repository maintenance

The checked-in browser extension is the source of truth for installable functionality. The current version remains **1.10.0** until a complete, reviewed implementation is committed; previously prepared 1.11.0/1.12.0 snapshots are not present in this branch.

- Runtime source, assets and regression tests remain at their existing paths.
- Superseded development reports live in [docs/archive](docs/archive/); they document historical work and do not describe the current release.
- Local screenshot exports and generated packages are excluded from Git. Keep user captures outside the repository or in an ignored `screenshots/` directory.
- The project has no npm manifest or third-party runtime dependency to upgrade. Do not add an npm build pipeline solely to make a version update.
- The automated checks and real Chrome/Edge acceptance gates below remain prerequisites for an actual new release.

## Release status and documentation

The **GitHub `main` source tree** currently identifies itself as **v1.10.0** in `manifest.json` and the popup. The separately prepared **v1.12.0** snapshot is **not** yet merged into this branch. The current development documentation explicitly marks the real-browser release gate as **pending**; do not interpret the version badge as a published or fully end-to-end-tested Chrome Web Store release.

| Document | Content |
| :-- | :-- |
| [Consumer release 1.10.0](CONSUMER-RELEASE-1.10.0.md) | Published source's UI polish scope and release prerequisites |
| [Testing](TESTING.md) | Automated evidence, historical checklists, and open acceptance items |
| [Phase 06 release report](PHASE-06-RELEASE-REPORT.md) | Security/performance review and release HOLD decision |
| [Historical release candidate notes](docs/archive/RELEASE-CANDIDATE.md) | Earlier release-candidate technical context |
| [Historical UI repair report](docs/archive/UI-REPAIR-REPORT-v1.9.1.md) | Prior UI repair details |

## License

Licensed under the **[MIT License](LICENSE)**. Copyright © 2026 JSM.

---

<div align="center">

**SCREENSHOT** · Capture precisely. Edit locally. Export instantly.

[Source code](https://github.com/jsmlabs/SCREENSHOT) · [Report an issue](https://github.com/jsmlabs/SCREENSHOT/issues) · [License](LICENSE)

</div>
