<div align="center">

# SCREENSHOT

**Capture. Edit. Share.**

### Capture anything. Keep it simple.

A modern, lightweight Chrome extension designed to make screen capture effortless. Built around simplicity, speed, and privacy.

**Everything you need to capture your screen. Nothing you don't.**

![Version](https://img.shields.io/badge/version-1.10.0-25262A?style=flat-square) ![Chrome](https://img.shields.io/badge/Chrome-Manifest%20V3-25262A?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-25262A?style=flat-square)

</div>

---

## Five ways to capture. One seamless experience.

| Capture | What it does |
| --- | --- |
| **Area** | Select exactly the part of the page you need. |
| **Element** | Capture a specific page element. |
| **Visible Tab** | Capture what's visible in your current tab. |
| **Window** | Capture a browser window with your permission. |
| **Full Page** | Capture a page beyond the visible viewport. |

### Made for the moment

- **Capture.** Choose the right capture mode in one click.
- **Edit.** Crop, annotate, add text, and refine the image.
- **Copy.** Automatically attempt to copy your original capture as a PNG; use the manual copy action whenever needed.
- **Save.** Export a PNG or enable optional automatic saving.
- **Stay organized.** Reopen and manage recent captures locally, with configurable retention.

### Your screen stays yours.

SCREENSHOT processes captures locally. The v1.10.0 extension has no cloud-upload feature, tracking, remote scripts, or runtime dependencies. Captures stored in history remain in Chrome's local extension storage until removed or pruned according to your settings.

> Browser and operating-system clipboard permissions apply. Some restricted Chrome pages cannot be captured. Blur and pixelation tools are not security-grade redaction.

## Get started

SCREENSHOT **v1.10.0 is a development build**, not yet a verified Chrome Web Store release.

1. Download or clone the project after its source files have been uploaded.
2. Open `chrome://extensions` in Chrome.
3. Turn on **Developer mode**.
4. Select **Load unpacked** and choose the folder containing `manifest.json`.
5. Pin SCREENSHOT, open a normal webpage, and choose a capture mode.

The extension interface currently uses German labels. Product positioning and repository documentation use English.

## For developers

Built with **Manifest V3**, plain JavaScript, HTML and CSS. No build system or external runtime packages are required.

```bash
node --test tests/*.test.mjs
node tests/release-check.mjs
```

See [TESTING.md](TESTING.md) for test procedures and [CONSUMER-RELEASE-1.10.0.md](CONSUMER-RELEASE-1.10.0.md) for the latest release notes, after those files are uploaded.

**Release status:** automated checks and static verification are distinct from interactive Chrome acceptance. The browser release gate remains **HOLD** pending live testing of all five capture modes, the editor, clipboard behavior, export and keyboard interactions. Do not treat v1.10.0 as a published store release.

## License

MIT. See [LICENSE](LICENSE).

---

<div align="center">

**SCREENSHOT** · Capture. Edit. Share.

*Simple by design. Private by default.*

</div>
