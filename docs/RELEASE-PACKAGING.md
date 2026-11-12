# SCREENSHOT - Release packaging

The project has two distinct ZIP artifacts:

- **Full source ZIP**: the complete project, including documentation, tests, branding source assets and optional development utilities. This is the editable handoff.
- **Runtime ZIP**: only `manifest.json`, `src/`, `_locales/` and `icons/`, with the manifest at the archive root. This is the minimal unpacked-extension / Chrome Web Store package candidate. It intentionally excludes tests, archives, Windows helper scripts and promotional artwork.

Regenerate a runtime candidate from the project root with Python 3 (standard library only):

```sh
python tools/package_runtime.py SCREENSHOT-runtime.zip
```

The packager checks required Manifest V3 entries, source paths, symbolic links and ZIP file integrity. It does **not** test actual browser behavior or submit the extension to a store. The project owner expressly waived manual browser acceptance on 2026-11-12. Runtime distribution therefore remains a decision based on automated verification only, with the browser behavior unverified.

Keep Store promotional assets under `branding/store/` outside the runtime package. They are promotional illustrations, not browser screenshots.

## Reproducible runtime package

Runtime ZIP entries are sorted by path and use fixed timestamps, explicit regular-file permissions and stable compression settings. Identical source bytes with the same Python/zlib implementation produce byte-identical archives, independent of source modification times. The packager checks exact stored bytes after writing, rejects symlinks and prevents placing the output within a runtime directory.

Run the focused packaging checks with the available Python standard library:

```sh
python -m unittest discover -s tests -p 'test_runtime_packaging.py' -v
```

Archive-byte reproducibility was tested locally by generating two packages from the same files. Cross-Python-version or cross-zlib-version byte identity is **not** guaranteed. This validation does not replace a Chrome runtime check (manually waived).

## Runtime file allowlist (2026-11-12)

The packager accepts only `.js`, `.mjs`, `.html`, `.css`, `.json`, and `.png` files within the three runtime directories. Hidden files/directories, symlinks and other extensions fail packaging rather than silently entering the distribution. This guards against accidentally bundling local `.env` files, backup copies and other unexpected material. If a future release intentionally introduces a new runtime format, explicitly review and extend the allowlist and its tests before packaging. This is not a content-level secrets scanner.

## Archived HTML and localization reference validation (2026-11-12)

Before writing a runtime archive, the packager validates each bundled HTML
`script[src]` and `link[href]` reference against the actual runtime member set.
Absolute, remote, and escaping paths are rejected. The manifest's
`__MSG_*__` placeholders must exist in every bundled `messages.json` language
file, and the declared default locale must be packaged. A missing HTML asset
or translation key fails the packaging operation without writing a ZIP.

The source-only regression test constructs a temporary project with a missing
Popup script or missing English locale key and asserts both fail. This is a
static archive completeness check, not a Chrome runtime test.

## JavaScript runtime reference checks (2026-11-12)

Before creating the runtime archive, the packager checks statically declared
relative ES-module imports/exports, literal `chrome.runtime.getURL(...)` paths,
and single-file literal `chrome.scripting.executeScript({files:[...]})`
references against the exact packaged member set. Missing targets fail early.
Source-only negative tests cover a missing module and a missing injected script.
This is deliberately bounded static matching, not exhaustive JavaScript parsing
or a replacement for browser execution.

## Conditional injected scripts (2026-11-12)

The packager additionally checks both literal branches of a single-line
`files: [condition ? "first.js" : "second.js"]` expression. This covers the
selection and element-selection injection used by the capture worker. A missing
branch aborts packaging before a ZIP is written. A negative regression test
verifies this behavior. Dynamically computed file paths and more complex
JavaScript expressions are outside this deliberately bounded static check.
