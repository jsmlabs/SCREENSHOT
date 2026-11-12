"""Focused source-only release-packaging regression checks."""

import hashlib
import importlib.util
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
SPEC = importlib.util.spec_from_file_location("package_runtime", ROOT / "tools/package_runtime.py")
PACKAGER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(PACKAGER)


class RuntimePackagingTests(unittest.TestCase):
    def test_reproducible_package_and_exact_content(self):
        with tempfile.TemporaryDirectory() as directory:
            paths = [Path(directory) / f"runtime-{n}.zip" for n in (1, 2)]
            totals = [PACKAGER.package(path) for path in paths]
            self.assertEqual(totals[0], totals[1])
            self.assertEqual(hashlib.sha256(paths[0].read_bytes()).digest(),
                             hashlib.sha256(paths[1].read_bytes()).digest())
            with ZipFile(paths[0]) as archive:
                self.assertIn("manifest.json", archive.namelist())
                self.assertNotIn("tests/runtime-packaging.test.py", archive.namelist())
                self.assertTrue(all(name == "manifest.json" or name.split("/")[0]
                                    in PACKAGER.RUNTIME_DIRS for name in archive.namelist()))
                self.assertTrue(all(item.date_time == PACKAGER.ZIP_TIMESTAMP
                                    for item in archive.infolist()))

    def test_rejects_output_in_runtime_tree(self):
        with self.assertRaisesRegex(ValueError, "outside runtime directories"):
            PACKAGER.package(ROOT / "icons" / "forbidden.zip")

    def test_rejects_unexpected_and_hidden_runtime_files(self):
        for name, message in (("backup.bak", "Unexpected runtime file type"),
                              (".env", "Hidden runtime path"),
                              (".private/secret.js", "Hidden runtime path")):
            with self.subTest(name=name), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                shutil.copy2(ROOT / "manifest.json", root / "manifest.json")
                for runtime_dir in PACKAGER.RUNTIME_DIRS:
                    shutil.copytree(ROOT / runtime_dir, root / runtime_dir)
                unexpected = root / "src" / name
                unexpected.parent.mkdir(parents=True, exist_ok=True)
                unexpected.write_text("DO_NOT_SHIP", encoding="utf-8")
                with patch.object(PACKAGER, "ROOT", root):
                    with self.assertRaisesRegex(ValueError, message):
                        PACKAGER.package(root / "runtime.zip")
                self.assertFalse((root / "runtime.zip").exists())

    def test_rejects_missing_html_dependency_and_locale_message(self):
        for target, marker in (("src/popup/popup.html", "Missing packaged HTML resource"),
                               ("_locales/en/messages.json", "Missing locale message keys")):
            with self.subTest(target=target), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                shutil.copy2(ROOT / "manifest.json", root / "manifest.json")
                for runtime_dir in PACKAGER.RUNTIME_DIRS:
                    shutil.copytree(ROOT / runtime_dir, root / runtime_dir)
                target_file = root / target
                if target.endswith(".html"):
                    target_file.write_text(target_file.read_text(encoding="utf-8").replace(
                        'src="popup.js"', 'src="missing-popup.js"'), encoding="utf-8")
                else:
                    import json
                    messages = json.loads(target_file.read_text(encoding="utf-8"))
                    messages.pop("appName")
                    target_file.write_text(json.dumps(messages), encoding="utf-8")
                with patch.object(PACKAGER, "ROOT", root):
                    with self.assertRaisesRegex((ValueError, FileNotFoundError), marker):
                        PACKAGER.package(root / "runtime.zip")
                self.assertFalse((root / "runtime.zip").exists())

    def test_rejects_missing_packaged_javascript_import(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copy2(ROOT / "manifest.json", root / "manifest.json")
            for runtime_dir in PACKAGER.RUNTIME_DIRS:
                shutil.copytree(ROOT / runtime_dir, root / runtime_dir)
            background = root / "src/background/background.js"
            background.write_text(background.read_text(encoding="utf-8") +
                                  "\nimport './missing-runtime-module.mjs';\n", encoding="utf-8")
            with patch.object(PACKAGER, "ROOT", root):
                with self.assertRaisesRegex(FileNotFoundError, "Missing packaged JS import"):
                    PACKAGER.package(root / "runtime.zip")
            self.assertFalse((root / "runtime.zip").exists())

    def test_rejects_missing_injected_script(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copy2(ROOT / "manifest.json", root / "manifest.json")
            for runtime_dir in PACKAGER.RUNTIME_DIRS:
                shutil.copytree(ROOT / runtime_dir, root / runtime_dir)
            background = root / "src/background/background.js"
            original = background.read_text(encoding="utf-8")
            old = "files:['src/capture/capture-recovery.js']"
            self.assertIn(old, original)
            background.write_text(original.replace(old, "files:['src/capture/missing-injected.js']"),
                                  encoding="utf-8")
            with patch.object(PACKAGER, "ROOT", root):
                with self.assertRaisesRegex(FileNotFoundError, "Missing packaged injected script"):
                    PACKAGER.package(root / "runtime.zip")
            self.assertFalse((root / "runtime.zip").exists())

    def test_rejects_missing_conditional_injected_script(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            shutil.copy2(ROOT / "manifest.json", root / "manifest.json")
            for runtime_dir in PACKAGER.RUNTIME_DIRS:
                shutil.copytree(ROOT / runtime_dir, root / runtime_dir)
            background = root / "src/background/background.js"
            original = background.read_text(encoding="utf-8")
            old = "'src/capture/element-selection.js'"
            self.assertIn(old, original)
            background.write_text(original.replace(old, "'src/capture/missing-element-selection.js'"),
                                  encoding="utf-8")
            with patch.object(PACKAGER, "ROOT", root):
                with self.assertRaisesRegex(FileNotFoundError, "Missing packaged conditional injected script"):
                    PACKAGER.package(root / "runtime.zip")
            self.assertFalse((root / "runtime.zip").exists())

    def test_rejects_symlinked_runtime_directory(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(PACKAGER, "ROOT", Path(directory)):
                (Path(directory) / "manifest.json").write_text('{"manifest_version":3}', encoding="utf8")
                (Path(directory) / "_locales").symlink_to(ROOT / "_locales", target_is_directory=True)
                with self.assertRaisesRegex(ValueError, "Symlink not permitted"):
                    PACKAGER.package(Path(directory) / "out.zip")


if __name__ == "__main__":
    unittest.main()
