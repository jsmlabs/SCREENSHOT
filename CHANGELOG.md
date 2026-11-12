## 1.18.3 - Multiple history undo (2026-11-12)

- Undo the five most recent individual history deletions in reverse order during the current popup session.
- Preserve original capture metadata, protect reused keys, and retain undo entries after failed storage writes.
- Show the number of recoverable deletions in the existing localized undo banner.
- Keep bulk-clear confirmation and session-only recovery behavior unchanged.
- No new extension permissions or dependencies; manual browser acceptance intentionally skipped.

## 1.18.2 - Recover deleted screenshots (2026-11-12)

- Replaced the per-capture confirmation dialog with a session-scoped Undo action in popup history.
- Restore the last deleted capture under the original storage key, preserving image and metadata.
- Keep the prior recovery available if a storage write fails; prevent overwriting a newly existing key.
- Preserve the existing confirmation for deleting the entire history; clear pending recovery on full clear.
- Localized recovery controls in five interface languages; no new permissions or dependencies.
- Browser acceptance remains intentionally waived; runtime behavior has not been tested in Chrome.

## 1.18.1 - History deletion confirmation (2026-11-12)

- Confirm before permanently deleting an individual capture from local history. Cancelling leaves the item untouched.
- Added confirmation text in German, English, French, Italian and Spanish.
- Added two focused regression checks; no new permissions or runtime dependencies.
- Chrome runtime and manual browser acceptance were not performed.

## 1.18.0 - Conditional injected-script packaging verification (2026-11-12)

- Verify both branches of literal conditional Chrome script-injection paths in the runtime packager.
- Add regression coverage for a missing element-selection script.
- No extension runtime files, permissions, or dependencies changed. Manual browser acceptance remains waived.

## 1.18.0 - Runtime archive safety follow-up (2026-11-12)

- Runtime packager now fails closed on hidden paths and files outside the supported extension-runtime types.
- Added regression cases for a hidden `.env`, a nested hidden folder and an accidental backup file.
- Source and runtime behavior unchanged; manual browser acceptance remains expressly waived.

## 1.18.0 - Runtime packaging follow-up (2026-11-12)

- Added an optional, dependency-free Python standard-library packager for a minimal Chromium runtime ZIP.
- Added `docs/RELEASE-PACKAGING.md` to distinguish editable source delivery from the runtime archive.
- No changes to extension runtime files, manifest permissions or version. Browser acceptance remains explicitly waived.

## Branding asset-integrity audit (November 12, 2026, package revision)
- Added PNG structural/CRC/decompressed-scanline verification for nine browser, logo and store images without new dependencies.
- Full local Node suite passes 157/157; capture logic and manifest version are unchanged.
- Manual browser acceptance remains explicitly waived.

## Branding polish (November 12, 2026, package revision)
- Centered the Precision logo geometry consistently in vector assets, live UI, raster icons, and promotional graphics.
- Added a regression test for the mark alignment. No capture workflow logic or manifest version changed.
- Recorded the owner-authorized manual browser acceptance waiver; browser operation remains unverified.

## 2026-11-12 - Branding verification follow-up (local candidate)

- Corrected CRLF compatibility in five existing Node VM worker-test harnesses.
- Full local test suite now passes (155/155, Node.js v22.16.0).
- No production capture logic, manifest permissions, or version changes in this follow-up.
- Chrome/Edge runtime validation is still pending.

## 2026-11-12 - Reliability and responsiveness improvements (local working candidate)

- Editor reuse now tolerates a tab disappearing between enumeration and navigation.
- Redundant editor cleanup occurs only after a usable editor is chosen; cleanup failures are nonfatal.
- Popup settings no longer reload the full PNG history for timer, export, autosave or language changes. Language changes repaint cached history directly.
- Added regression coverage for stale editor tabs, cleanup failure, and preference-refresh scope.
- Preserved the single-editor-window policy, Manifest V3 permissions, version 1.18.0 and prior popup sizing fixes.

# Changelog

## 1.18.0 - Reliability and history responsiveness

### Improved
- Reuses the existing SCREENSHOT editor window for new captures, history items, and window previews; serializes concurrent open requests and removes duplicate editor tabs.
- Library search and favorites filtering render from a local popup snapshot without repeatedly reading full PNG payloads from Chrome storage per keystroke.
- Concurrent asynchronous library refreshes discard stale results before changing the visible list.
- Accent-insensitive local history search, validated screenshot names before whitespace normalization, and a one-operation-at-a-time guard for history actions.
- Retains the 1.13.0-1.17.0 improvements and current Manifest V3 permissions.

### Verification boundary
- Node unit/regression tests and static release checks; manual Chrome/Edge validation still required before production distribution.


## 1.17.0 - History & Export (Roadmap 3.0 Phase 05)

### Added
- Searchable local screenshot history by name, capture mode, and date.
- Favorite toggle and favorites-only filter. Favorites are protected from age expiry and receive priority within the configured item limit.
- Rename screenshots locally with validated, whitespace-normalized names (1-80 characters).
- Direct PNG download for individual history records.
- Configurable filename prefix (ASCII letters, numbers, `_` and `-`; max 40) and "choose save location" option for manual, automatic, and history export.
- Storage usage estimate and visible match/total counts in the popup.
- Extended history settings: 5, 10, 20, 50, or 100 items and 1, 3, 7, or 30 days.
- Matching popup translations across German, English, French, Italian, and Spanish.
- Pure library helpers and six regression tests for filtering, retention, safe filenames, localization, and integration wiring.

### Preserved
- All five capture modes, screenshot editor, new capture action, automatic clipboard, existing history records, MV3 permissions, settings key, system/browser language detection and manual language override.
- Local-only handling with no new runtime dependencies, remote endpoints, or permissions.

### Limitations
- Captures are stored as PNG data URLs in chrome.storage.local; quota and memory pressure depend on the browser and image size.
- Favorites are not permanent backups: they are still subject to the total item cap and explicit "Clear history".
- No verified Chrome extension runtime interaction or visual acceptance test due to environment restrictions.

## History
Earlier release notes are available in the previous release archives and historical PHASE reports.

## 1.18.0 - Reproducible runtime packaging follow-up (2026-11-12)

- Made runtime ZIP metadata deterministic for a fixed Python/zlib environment; verified exact included bytes.
- Blocked symlinked runtime roots and output archives within packaged runtime folders.
- Added three Python standard-library regression tests and updated packaging documentation.
- Extension runtime source, public version and manifest permissions remain unchanged. Manual browser acceptance remains waived.

2026-11-12: Strengthened runtime packaging to reject missing local HTML dependencies and missing manifest locale keys, with a focused regression test; no production runtime changes.

2026-11-12: Packager now validates literal JavaScript ESM imports and Chrome runtime/injected resource references against packaged members; added focused negative regression cases. No runtime behavior changed.
