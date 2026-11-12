# Changelog

## 1.18.0 - Reliability and history responsiveness

### Improved
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
