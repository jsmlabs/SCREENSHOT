# SCREENSHOT v1.11.0 – Language support

## Language selection

- Default: **Automatic (browser language)**. Uses `navigator.languages` in priority order, with Chrome UI language as fallback.
- Manual choice: **German, English, French, Italian or Spanish** in Popup → Settings → Language.
- Stored in the existing `settings:v1` local preference (no migration and no extra permissions).
- A selected language applies to the popup and editor when reopened. Changes within the popup update its labels immediately.
- Unsupported browser languages fall back to English. Regional variants (e.g., `de-CH`, `es-MX`) map to their base language.
- Chrome manifest name, description, action tooltip and command descriptions use bundled `_locales` files.
- All translations are bundled locally. No remote translation service or network request.

## Validation

- `node --test tests/*.test.mjs`: 112/112 passed.
- `node tests/release-check.mjs`: passed.
- `node --check popup.js`, `node --check editor.js`: passed.
- Syntax and static tests are not a substitute for Chrome GUI testing. Manual browser check recommended for each locale, especially editor status texts and Chrome Web Store metadata.

## Known scope

User-facing strings originating directly from browser/OS exceptions and capture subsystem error payloads are surfaced as provided by their source. Some detailed editor status phrases may remain untranslated; core navigation and controls have translations.
