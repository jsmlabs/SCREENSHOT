# SCREENSHOT 1.12.0 – New capture from editor

- New capture button in editor header; modal chooser for area, element, visible tab, window and full page.
- Reuses the existing capture dispatcher, configured timer and background validation.
- Remembers the originating web tab in new capture history entries; falls back to an active HTTP(S) tab for legacy records.
- Refocuses the source web tab before starting the capture, avoiding extension-page captures.
- Leaves the current editor and image intact on success, cancellation or error. New result opens in a separate editor window.
- Localized button and dialog title for all five supported languages.
- Adds focused mode, tab selection and UI-contract tests.

Verification: node --test tests/*.test.mjs; node tests/release-check.mjs; node --check on affected modules. Manual Chrome GUI integration test remains pending.
