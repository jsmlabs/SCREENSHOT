# Phase 01 - Capture Reliability 3.0: Verification Report

**Release candidate:** SCREENSHOT 1.13.0
**Date:** 2026-11-11
**Base:** SCREENSHOT 1.12.0 - New Capture
**Scope:** Capture state cleanup, tab/navigation integrity, timeout handling, history protection, tests and packaging.

## Changes verified by inspection

- Added `capture-source.mjs` for tab identity, active state and URL checks.
- Worker validates source at capture start and again after delay and before and after image capture.
- Worker tracks in-flight capture functions including page cleanup, preventing new jobs until cleanup completes.
- Browser API calls for source querying, scripting and offscreen setup have finite operation deadlines.
- Error previews do not prune previously successful captures; stored error previews are capped.
- Editor New Capture, selection, visible, window and full-page routes remain present; no permission additions.

## Commands and evidence

| Check | Command | Result |
|---|---|---|
| Baseline | `node --test tests/*.test.mjs` on original 1.12.0 | PASS: 116/116 |
| Final regression | `node --test tests/*.test.mjs` | PASS: 121/121 |
| JS parse | `node --check` on each top-level `*.js`, `*.mjs` | PASS |
| Release structure | `node tests/release-check.mjs` | PASS |
| Headless browser | `python tests/browser_e2e.py` | BLOCKED: Chromium Playwright session timed out waiting 12 seconds for the extension service worker. No actual capture E2E pass is claimed. |

## Acceptance checklist (Chrome manual run required)

1. Load the unpacked 1.13.0 directory under `chrome://extensions` with Developer mode enabled.
2. Confirm popup version 1.13.0 and language auto/manual selections DE, EN, FR, IT, ES.
3. On an HTTP(S) test page, capture each of: area, element, visible tab, window, entire page.
4. Open the editor, annotate an image, then choose **New capture** in each mode. Verify the old editor and its edits remain when the new capture is cancelled or fails.
5. During a delayed capture, switch tabs or navigate. Confirm the capture refuses to publish an image from a different page.
6. During page selection, press Escape; retry capture. Repeat during full-page capture, verify scroll position and fixed/sticky UI are restored.
7. Attempt a large/dynamically changing page; verify a comprehensible failure rather than a partial successful screenshot.
8. Configure history limit 1; keep a successful image and force a capture failure; confirm previous image remains in history.
9. Verify automatic clipboard, manual copy, export and annotated image preservation.
10. Reload the extension and recheck settings/history persistence.

## Not verified

- Chrome UI operation, browser actions, page-scrolling appearance, locale accuracy on all five languages and OS clipboard across platforms.
- Browser-specific API behavior, permission failures, performance on arbitrary large/dynamic sites and Web Store compliance review.

**Verdict:** Automated regression and packaging candidate passed. Real Chrome acceptance is pending; this is not a claim of production deployment or store approval.
