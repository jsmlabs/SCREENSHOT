# SCREENSHOT v1.15.0 - Phase 03 Premium GUI / UI / UX

Date: 2026-11-11
Base: SCREENSHOT v1.14.0 Editor Pro ZIP
Status: Automated release candidate, **not Chrome-runtime accepted**.

## Scope delivered
- Popup capture modes styled as consistent, focusable cards with improved typographic hierarchy, hover/active feedback and visual density.
- Settings panel, local history, empty state, footer and asynchronous status presentation refreshed.
- Editor header, tool states, zoom strip, canvas stage, shortcut help and new capture modal unified.
- Adaptive layout for narrow screens, reduced-motion users and forced-colors environments.
- Manifest and popup display updated to 1.15.0; five existing languages and all capture/editor IDs preserved.

## Changes
- `style.css`: appended v1.15.0 presentation rules, with no new remote assets.
- `popup.html`: corrected version indicator.
- `manifest.json`: bumped version.
- `tests/phase03-premium-ui.test.mjs`: added three regression tests.
- Updated legacy version assertions in `tests/package.test.mjs`, `tests/release-check.mjs`, `tests/ui-repair.test.mjs`.
- `README.md`, `CHANGELOG.md`: release documentation.

## Verification actually performed
| Check | Result |
| --- | --- |
| `node --test tests/*.test.mjs` | PASS, 130 / 130 |
| `node tests/release-check.mjs` | PASS |
| `node --check` on every top-level JS/MJS file | PASS |
| ZIP CRC (`unzip -t`) | See final packaging check |
| Headless Chromium file-based screenshot | BLOCKED / TIMEOUT (18 seconds), no screenshot emitted |
| Chrome extension manual capture + GUI verification | NOT RUN |
| Accessibility audit with real screen reader | NOT RUN |

## Risks / limits
- Automated contracts verify presence of controls and styling hooks, not real browser layout or visual quality.
- Chromium could not complete a headless preview; Chrome-specific extension APIs and responsive rendering require a real browser test.
- Older CSS rules remain as a compatibility layer, with v1.15.0 overrides. A future CSS consolidation should be independently regression-tested.
- The release is not approved for Chrome Web Store publication until visual and functional acceptance in Chrome.

## Manual Chrome acceptance checklist
1. Load unpacked directory at `chrome://extensions` and confirm version 1.15.0.
2. At 100%, 125% and 150% display scaling inspect popup capture cards, preferences, history, status and focus indicators.
3. Test five capture modes, cancellation, tab switching, auto-clipboard, editor new capture and failure recovery.
4. In editor test tool selection, annotations, object resize, keyboard nudges, undo/redo, zoom, copy and export.
5. Switch DE/EN/FR/IT/ES and automatic browser language; check truncation and accessibility names.
6. Compare light/dark color schemes, keyboard focus order and reduced-motion setting.

Rollback: reinstall v1.14.0 ZIP after preserving existing storage; no storage migrations were introduced.
