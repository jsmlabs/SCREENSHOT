# SCREENSHOT - Brand Identity

## Core idea
A capture frame with a registration point. The framing corners represent precise selection; the central square represents a confirmed capture. No generic camera metaphor.

## Logo concept review
| Concept | Strength | Limitation | Decision |
| --- | --- | --- | --- |
| Precision | Direct capture metaphor, simple silhouette, clear small-size forms | Central dot is subtle at 16 px | **Selected** |
| Frame | Strong contiguous border | Less distinguishable from standard window icons | Not selected |
| Focus | Strong cropping metaphor | Crosshair can suggest targeting instead of screenshots | Not selected |

The three editable SVG sources are in `branding/concepts/`.

## Identity tokens
- Brand name: **SCREENSHOT** (unchanged)
- Primary canvas: `#111214` near-black; mark: `#FFFFFF`
- Inverted: white canvas with `#111214` mark
- Existing app colors, semantic success/error and focus tokens remain unchanged
- Typography: native system UI / Arial for export vector wordmark (no external fonts)
- Wordmark: uppercase, bold, slightly tracked. No gradient or drop shadow.
- Clear space: minimum 1/4 of mark width on all sides for isolated use.
- Do not rotate, stretch, colorize, or surround mark with distracting decoration.

## Files and usage
- `branding/logo/` SVG masters and 512 px presentation PNGs.
- `icons/icon16.png`, `icon32.png`, `icon48.png`, `icon128.png`, `icon256.png`: Chromium raster assets. Manifest paths remain unchanged.
- Popup/editor: inline shared SVG geometry, inheriting theme color with `currentColor`; no network dependencies.
- `branding/store/`: promotional illustrations (440x280 and 1400x560). These are **not** actual screenshots of the extension, and must not be represented as UI screenshots in store submissions.
- `branding/concepts/`: the unselected and selected vector design alternatives.

## Accessibility and platform
The live UI mark is decorative (`aria-hidden=true`) because adjacent text names the product. Light/dark color modes use CSS text/background tokens. Windows forced-colors receives an explicit border. Existing focus ring and reduced-motion rules are unchanged.

## Validation limits
Use `node --test tests/*.test.mjs` for available source-level tests. Chrome install, extension runtime, real browser screenshot checks and official store approval require the actual target host.

## Geometric alignment
The selected mark uses a 128 × 128 coordinate system. Its outer frame is symmetric
around `(64, 64)` (left/right x=23/105, top/bottom y=23/105); the center square
is x=57..71, y=57..71. This invariant is covered by `tests/branding.test.mjs`.

## Acceptance boundary
The manual browser acceptance gate was explicitly waived by the project owner
on November 12, 2026. Automated checks do not establish actual Chrome behavior
or Chrome Web Store approval.
