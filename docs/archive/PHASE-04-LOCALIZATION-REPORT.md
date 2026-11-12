# Phase 04 - Localization Complete (v1.16.0)

Date: 2026-11-11
Base: SCREENSHOT v1.15.0 Premium UI / UX archive
Scope: Localization of user-facing popup/editor text, status messages, dialogs, known capture errors and accessibility labels in DE, EN, FR, IT, ES.

## Implemented

- Preserved the existing automatic browser-language detection and locally persisted manual language selector.
- Expanded the shared locale catalog to include missing static editor/popup strings, tooltips, accessibility names, source-tab errors, worker errors, cancellation/timeout diagnostics, clipboard and editor errors.
- Introduced `translateError` to localize known errors, contextual prefixes and timed-out operations; unknown platform errors are shown as a localized generic error instead of untranslated diagnostics.
- Re-localize any currently displayed popup error when the preference changes. Wait for initial language resolution before loading editor content.
- Updated UI/manifest version to 1.16.0. Kept the existing Chrome `_locales` translation metadata, five capture modes, editor functionality and styling.
- Added tests checking catalog parity across all five languages and coverage of static HTML labels, literal dynamic translations and selected error formatting behavior.

## Verification evidence

| Check | Outcome | Evidence |
| --- | --- | --- |
| Node automated tests | PASS: 135/135 | `node --test tests/*.test.mjs` |
| JavaScript parsing | PASS | `node --check` on application JS/MJS files |
| JSON validation | PASS | manifest and five `_locales/*/messages.json` |
| Release structure | PASS | `node tests/release-check.mjs` |
| Chromium editor UI via Playwright | BLOCKED | `Page.goto`: `net::ERR_BLOCKED_BY_ADMINISTRATOR` at localhost |
| Installed extension E2E (all five modes, permissions, clipboard, editor interaction) | NOT RUN | Chrome extension runtime not available for this test |
| In-browser visual language audit | NOT RUN | Browser navigation blocked by execution environment |

## Remaining risks / manual acceptance

1. Install unpacked extension in Chrome; confirm default language follows the browser UI language and the manual preference survives popup restarts and editor reopen.
2. Inspect popup and editor in DE/EN/FR/IT/ES, including long strings, high-contrast, light/dark theme, and keyboard/screen-reader names.
3. Trigger all five capture modes, deliberate cancellation, closed/changed tab, blocked page, history reopen/error, clipboard denial, window sharing denial, and timeout; check resulting localized texts.
4. Confirm successful exports and original screenshot preservation through all error journeys.
5. Background/selection injection diagnostics are not independently localized at source, but known errors are translated before display in popup/editor. Chrome-owned permission dialogs, native error messages and browser UI remain controlled by the browser.

Release status: automated-test-passing candidate, not Chrome-browser-accepted or Chrome Web Store published.
Rollback: restore v1.15.0 unpacked extension. Existing settings and history keys remain compatible.
