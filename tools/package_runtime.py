"""Create a deterministic, minimal Chromium extension ZIP (Python standard library).

This checks package contents, not Chrome runtime behavior or store acceptance.
"""

from __future__ import annotations

import argparse
import json
import posixpath
import re
from html.parser import HTMLParser
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parent.parent
RUNTIME_DIRS = ("_locales", "icons", "src")
ZIP_TIMESTAMP = (1980, 1, 1, 0, 0, 0)
RUNTIME_SUFFIXES = frozenset({".js", ".mjs", ".html", ".css", ".json", ".png"})


class _LocalHtmlRefs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        if tag not in ("script", "link"):
            return
        values = dict(attrs)
        key = "src" if tag == "script" else "href"
        if values.get(key):
            self.refs.append(values[key])


def validate_runtime_references(manifest: dict, member_names: set[str], root: Path) -> None:
    """Check packaged HTML dependencies and manifest localization against included bytes."""
    for name in sorted(member_names):
        if not name.endswith(".html"):
            continue
        parser = _LocalHtmlRefs()
        parser.feed((root / name).read_text(encoding="utf-8"))
        for ref in parser.refs:
            if ref.startswith(("/", "//")) or re.match(r"^[a-z][a-z0-9+.-]*:", ref, re.I):
                raise ValueError(f"Non-local HTML resource: {name}: {ref}")
            target = posixpath.normpath(posixpath.join(posixpath.dirname(name), ref.split("?", 1)[0].split("#", 1)[0]))
            if target == ".." or target.startswith("../") or target not in member_names:
                raise FileNotFoundError(f"Missing packaged HTML resource: {name}: {ref}")

    locale = manifest.get("default_locale")
    if locale:
        required = set(re.findall(r"__MSG_([A-Za-z0-9_]+)__", json.dumps(manifest)))
        for language_file in sorted(name for name in member_names
                                    if re.fullmatch(r"_locales/[^/]+/messages\.json", name)):
            messages = json.loads((root / language_file).read_text(encoding="utf-8"))
            missing = required - messages.keys()
            if missing:
                raise ValueError(f"Missing locale message keys in {language_file}: {sorted(missing)}")
        if f"_locales/{locale}/messages.json" not in member_names:
            raise FileNotFoundError(f"Missing default locale: {locale}")


def validate_runtime_script_references(member_names: set[str], root: Path) -> None:
    """Reject missing relative ESM imports and literal Chrome-injected runtime files."""
    # This is a bounded static check, not a JavaScript parser or an execution check.
    imports = re.compile(r"\b(?:import\s*(?:[^;\n]*?\s+from\s*)?|export\s+[^;\n]*?\s+from\s*)[\"'](\.[^\"']+)[\"']")
    chrome_paths = re.compile(r"\bchrome\.runtime\.getURL\(\s*[\"']([^\"']+)[\"']\s*\)")
    injected_paths = re.compile(r"\bfiles\s*:\s*\[\s*[\"']([^\"']+)[\"']\s*\]")
    conditional_injected_paths = re.compile(
        r"\bfiles\s*:\s*\[[^\]\n]*?\?\s*([\"'])([^\"']+)\1\s*:\s*([\"'])([^\"']+)\3\s*\]"
    )
    for name in sorted(member_names):
        if not name.endswith((".js", ".mjs")):
            continue
        script = (root / name).read_text(encoding="utf-8")
        for match in imports.finditer(script):
            ref = match.group(1)
            target = posixpath.normpath(posixpath.join(posixpath.dirname(name), ref.split("?", 1)[0].split("#", 1)[0]))
            if target not in member_names:
                raise FileNotFoundError(f"Missing packaged JS import: {name}: {ref}")
        for pattern, kind in ((chrome_paths, "runtime URL"), (injected_paths, "injected script")):
            for match in pattern.finditer(script):
                ref = match.group(1)
                if ref.startswith("/") or ref not in member_names:
                    raise FileNotFoundError(f"Missing packaged {kind}: {name}: {ref}")
        for match in conditional_injected_paths.finditer(script):
            for ref in (match.group(2), match.group(4)):
                if ref.startswith("/") or ref not in member_names:
                    raise FileNotFoundError(f"Missing packaged conditional injected script: {name}: {ref}")


def package(output: Path) -> tuple[int, str]:
    manifest_file = ROOT / "manifest.json"
    if manifest_file.is_symlink():
        raise ValueError("Symlink not permitted: manifest.json")
    manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
    if manifest.get("manifest_version") != 3:
        raise ValueError("Expected a Manifest V3 project")

    members = [manifest_file]
    for directory in RUNTIME_DIRS:
        source = ROOT / directory
        if source.is_symlink():
            raise ValueError(f"Symlink not permitted: {directory}")
        if not source.is_dir():
            raise FileNotFoundError(f"Missing runtime directory: {directory}")
        for path in source.rglob("*"):
            if path.is_symlink():
                raise ValueError(f"Symlink not permitted: {path}")
            name = path.relative_to(ROOT)
            if any(part.startswith(".") for part in name.parts):
                raise ValueError(f"Hidden runtime path not permitted: {name}")
            if path.is_file():
                if path.suffix.lower() not in RUNTIME_SUFFIXES:
                    raise ValueError(f"Unexpected runtime file type: {name}")
                members.append(path)

    member_names = {file.relative_to(ROOT).as_posix() for file in members}
    referenced = [
        manifest["background"]["service_worker"],
        manifest["action"]["default_popup"],
        *manifest["icons"].values(),
    ]
    missing = set(referenced) - member_names
    if missing:
        raise FileNotFoundError(f"Missing required manifest files: {sorted(missing)}")

    for name in member_names:
        if name.endswith((".pyc", ".log", ".zip")) or "/__pycache__/" in name:
            raise ValueError(f"Development file in runtime directory: {name}")

    validate_runtime_references(manifest, member_names, ROOT)
    validate_runtime_script_references(member_names, ROOT)

    output = output.resolve()
    # Exclude output anywhere inside runtime-owned trees, even on repeated packaging.
    for directory in RUNTIME_DIRS:
        if output.is_relative_to((ROOT / directory).resolve()):
            raise ValueError("Output ZIP must be outside runtime directories")
    if output == manifest_file:
        raise ValueError("Cannot overwrite manifest.json")

    output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(output, "w", compression=ZIP_DEFLATED, compresslevel=9) as archive:
        for file in sorted(members, key=lambda entry: entry.relative_to(ROOT).as_posix()):
            name = file.relative_to(ROOT).as_posix()
            info = ZipInfo(name, ZIP_TIMESTAMP)
            info.compress_type = ZIP_DEFLATED
            info.create_system = 3
            info.external_attr = 0o100644 << 16  # Regular, non-executable file.
            archive.writestr(info, file.read_bytes(), compress_type=ZIP_DEFLATED, compresslevel=9)

    with ZipFile(output) as archive:
        if archive.testzip() is not None or set(archive.namelist()) != member_names:
            raise ValueError("Runtime ZIP verification failed")
        if len(archive.namelist()) != len(member_names):
            raise ValueError("Duplicate ZIP entries detected")
        if any(archive.read(name) != (ROOT / name).read_bytes() for name in member_names):
            raise ValueError("Runtime ZIP content mismatch")

    return len(members), manifest["version"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", type=Path, help="Destination ZIP path")
    args = parser.parse_args()
    total, version = package(args.output)
    print(f"SCREENSHOT v{version}: {total} runtime files, ZIP verified: {args.output}")
