## Phase 06 gate

Status **HOLD** pending real extension and Windows clipboard E2E acceptance. See [PHASE-06-RELEASE-REPORT.md](PHASE-06-RELEASE-REPORT.md).

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

## Phase 03 Capture Engine 2.0 (2026-11-11)

- Added post-settle scroll/layout integrity checks, bounded aggregate PNG capture payloads, a 120-second tiling deadline, and page-owned 125-second cleanup watchdog for service-worker interruption.
- Fixed prior temporary floating-element marker collision so unrelated page attributes are preserved; hiding applies only to extension-owned marks.
- Retained the existing measured-bitmap scaling / non-overlapping tile compositing, all five capture modes, Phase 01 Clipboard, Phase 02 UI, manifest 1.9.0, permissions, and external APIs.
- 89/89 Node tests passed, syntax and release checks passed. Full-package ZIP verified. Real Chrome/Edge full-page capture and watchdog execution under actual MV3 suspension remain release gates.
- Known limitation: page recovery is best-effort if Chromium throttles content-script timers; highly dynamic sites may be rejected rather than captured inaccurately.

## Phase 02 UI update (2026-11-11)

- Modernized popup and editor visual design while preserving the 1.9.0 manifest, existing APIs, permissions, and Phase 01 clipboard reliability.
- Added inline SVG artwork, responsive icon-only toolbar presentation with accessible labels, inline shortcut reference, improved busy/error live feedback, and collision-safe capture-start UI guard.
- 83/83 Node tests passed, JavaScript syntax and release structure verified. Chromium standalone HTML/CSS rendering verified for dark/light popup and desktop/mobile editor shells.
- Browser-admin policy blocks the existing local HTTP Playwright preview test. Real Chrome/Edge extension runtime, Windows clipboard and capture E2E are still required before release.

## Phase 01 update (2026-11-11)

- Clipboard auto-copy waits for the decoded source and successfully loaded editor preview.
- Clipboard permission/security denials remain pending until another foreground interaction; no background retry loop.
- Foreground keyboard activation now triggers pending-copy retry alongside pointer/focus/visibility events.
- Explicitly preserve manual edited-image copy precedence and avoid stale success announcements.
- 80/80 automated tests passed; real Chrome/Windows clipboard acceptance remains unverified.
- Manifest and public entry points remain v1.9.0; no added permissions or dependencies.

# SCREENSHOT v1.9.0 - Release Candidate

## Status

Candidate for manual Windows/Chromium validation, **not a production stable release**.

## Changes

1. Added explicit sender checks for privileged runtime commands, selection callbacks, and offscreen composition.
2. Rejected unsupported image composition modes, missing crop data, inconsistent tile counts, invalid pixel dimensions and malformed PNG data URLs before allocation.
3. Preserved the five capture modes, isolated popup previews, focus request, 6px inset, zoom/pan, non-destructive editor, undo/redo and local PNG/clipboard export.
4. Introduced security regression tests and deterministic release verification.

## Verification commands

Run from the extension folder on Node 20+:

```sh
node --test tests/*.test.mjs
node tests/release-check.mjs
```

Run manual browser checks with the `TESTING.md` checklist. The Python/Playwright scripts in `tests/` are optional and need local browser automation dependencies.

## Security audit summary

- Required permissions retained: `activeTab`, `scripting`, `tabs`, `storage`, `unlimitedStorage`, `offscreen`.
- No static broad `host_permissions` or external JS libraries.
- Capture data stored only in `chrome.storage.local` for up to 24 hours, with rolling cleanup on the next capture. It may persist longer if no later captures are made; this is a **known privacy limitation** for v2.0.
- UI and compositing use fixed local HTML/JS entrypoints. Data from content scripts is treated as untrusted in composition.
- UI authorization uses runtime sender metadata. The worker remains exposed to content-script selection callback messages only for the active matching tab and top-level frame.
- Full-page capture mutates temporary DOM attributes and scroll state; cleanup is attempted in finally. Tab closure or unexpected worker shutdown can interrupt this; not fully recoverable yet.
- Internal Chrome extension pages and OS protected surfaces remain unsupported.

## v2.0 release blockers

- Real Chrome and Edge capture+preview+export E2E on Windows, including after extension reload.
- Full-page fidelity against static and dynamic fixtures; test sticky/fixed overlays, lazy loading and seams at multiple DPRs.
- Manual security checks: frame spoofing, permission expiry, interrupted capture cleanup, malformed capture messages.
- Test foreground focus behavior with Windows OS policies, scaling, and two monitors.
- Confirm clipboard behavior, save/download, tool shortcuts, crop, annotations, undo/redo and accessibility in a real browser.
- Resolve or explicitly accept lingering stored screenshot data; validate storage pressure on large images.

No release gate above is counted as passed without execution evidence.
