# Phase 05 - History & Export Verification Report

**Version:** 1.17.0 | **Base:** 1.16.0 | **Status:** automated-test-verified release candidate, not browser-accepted.

## Scope implemented
1. Search existing local captures by their custom name, mode, or localized date; favorites-only toggle and featured favorites first.
2. Rename local captures (1-80 characters, control characters rejected), toggle favorite, delete, open in editor, and direct PNG export.
3. Opt-in export preferences: filename prefix and Chrome save-location chooser. Preferences also apply to editor downloads and opt-in auto-save.
4. Display current matching count, total history count, and approximate saved capture storage usage via Chrome storage API.
5. Extend limits to 100 entries / 30 days. Age expiration does not remove favorites; total limit continues to apply, prioritizing favorites by recency and then unpinned items.
6. Extend DE, EN, FR, IT and ES translations for all newly introduced user-visible UI labels.

## Evidence
- `node --test tests/*.test.mjs`: 141 passed, 0 failed (final).
- `node tests/release-check.mjs`: PASS (MV3 structure and safe resource checks).
- `node --check` on source and test JS/MJS files: PASS.
- `python -m json.tool manifest.json` and all `_locales/*/messages.json`: PASS.
- ZIP integrity / path and file inventory: checked on generated artifact.
- Chromium UI attempt: FAILED TO RUN due to `net::ERR_BLOCKED_BY_ADMINISTRATOR` when visiting localhost, before application interaction. This does not establish a runtime defect, nor a browser pass.

## Risks / manual acceptance outstanding
- Install unpacked release in Chrome, confirm startup without console errors, all five languages, light/dark layout, and normal capture/editor/export paths.
- Search by custom name, mode and date; rename, pin/unpin, switch favorite filter and confirm persistence after reopening popup.
- Verify favorites survive age threshold when count is below limit and newer non-favorites are removed first at capacity. Verify favorites older than limit are removed if *all* are favorites.
- Test exports with chosen prefix and save-location chooser; verify canceled download leaves image intact and errors are surfaced.
- Confirm history storage estimate and responsive controls at 320-400 px popup width and keyboard focus states.
- Verify large capture behavior and Chrome storage pressure; stored screenshots are not backed up externally.

## Compatibility and rollback
- Existing `settings:v1` and `capture:<uuid>` records are read without data migrations. Optional `name` and `favorite` keys are additive; new settings have defaults when missing.
- Rollback to v1.16.0 requires no migration, but old code ignores new per-capture metadata and export preferences; older pruning rules may remove favorited items. Back up important images first.
- No added host permissions, backend or network dependency.
