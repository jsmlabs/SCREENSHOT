# SCREENSHOT v1.9.1 — GUI/UI repair report

## Scope
Input: SCREENSHOT-Repaired-v1.9.0.zip / existing extracted source. Targeted popup and editor layout/state repairs only. Chrome MV3 extension identity, modes, clipboard and capture contracts retained.

## Changes
- Popup viewport constrained to 600px with independently scrollable content and persistent header/footer to keep history/settings reachable.
- Capture options and settings spacing reduced to accommodate smaller browser popup windows.
- Editor workspace bounded on compact screens, with scrollable tools and shrinkable image stage to prevent toolbar growth from pushing the screenshot off screen.
- Mobile-height layout overrides and image viewport minimum-size fix.
- Settings rollback now restores the displayed UI fields after failed `chrome.storage.local.set`, instead of only restoring internal state.
- Successful settings save clears previously shown error status.
- Timer DOM reference initialized before preference loading.
- Version bumped to 1.9.1 in manifest and popup UI.

## Verification (local)
- `node --test tests/*.test.mjs` -> 109 passed, 0 failed (includes 4 UI repair regression checks).
- `node --check` on all root JS/MJS -> passed.
- Chromium page rendering could not be verified: Playwright navigations to HTTP localhost, file, and data URLs were blocked by administrator policy (ERR_BLOCKED_BY_ADMINISTRATOR).
- No live Chrome extension popup, editor, clipboard or full capture end-to-end validation was completed.

## Remaining risk
Static layout tests do not establish visual correctness in the installed browser. Re-test popup at different window heights and editor at 360px, 620px and desktop widths in a regular Chrome profile; inspect Chrome extension errors and screenshots for issues that remain. The specific visual symptom was not provided, so this is a targeted best-effort repair, not proof that every UI defect is resolved.
