# SCREENSHOT - Validation & Repair Report

Date: 2026-11-11
Baseline: supplied v1.9.0 archive (preserved; no unrequested version bump)

## Implemented fixes

1. **Transactional capture history retention:** new screenshots are written and the preview is opened before expired/excess history entries are removed. Failed storage or preview creation no longer deletes previously stored history. New capture is rolled back if preview opening fails.
2. **Non-critical cleanup handling:** cleanup failure is logged, rather than marking an otherwise successfully opened capture as failed.
3. **Cancel/preview race:** after cancellation, a late preview error no longer produces an unwanted error preview.
4. **Selection cancellation race:** if an overlay injection finishes after a capture has already been cancelled, send Escape to clean up the stale overlay.
5. **Selection state cleanup:** cancellation and selection timeout clear the pending selection timer.
6. **Regression coverage:** three executable worker tests added for storage failure, preview failure, and successful retention. Updated one brittle source-pattern test to match the new retention flow.

## Validation

- Initial tests: 102 passed, 0 failed.
- After changes: 105 passed, 0 failed.
- `node --check` run on top-level JS/MJS source files: passed.
- Archive assembled from the supplied project with existing assets, modules, and test files preserved.

## Verification boundaries

- Tests are Node-based and use mocked Chrome interfaces. They are not a substitute for installing the unpacked extension and exercising Chrome permissions, desktop clipboard, window capture permissions, or full-page stitching on real websites.
- No claim is made that every possible defect is repaired or that live browser integration was verified.
- Suggested hands-on smoke paths: visible and full-page PNG capture, area/element cancellation, window capture permissions, clipboard on focused/unfocused preview, auto-save, history reopen, keyboard shortcuts.
