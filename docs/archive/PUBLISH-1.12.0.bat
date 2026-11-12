@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
set "SOURCE=%~dp0"
set "REPOSITORY=https://github.com/jsmlabs/SCREENSHOT.git"
set "TARGET=%TEMP%\SCREENSHOT-publish-%RANDOM%-%RANDOM%"
for /f %%E in ('echo prompt $E ^| cmd') do set "ESC=%%E"
set "C=%ESC%[96m"
set "G=%ESC%[92m"
set "Y=%ESC%[93m"
set "R=%ESC%[91m"
set "N=%ESC%[0m"
title SCREENSHOT 1.12.0 - Verified Publish
cls
echo %C%  ========================================================================%N%
echo   SCREENSHOT  /  1.12.0 RELEASE SYNCHRONIZATION
echo %C%  ========================================================================%N%
echo.
where git >nul 2>&1 || (echo %R%  [ERROR] Git not found in PATH.%N% & goto :failed)
if not exist "%SOURCE%manifest.json" (echo %R%  [ERROR] manifest.json not found next to this script.%N% & goto :failed)
findstr /c:"\"version\": \"1.12.0\"" "%SOURCE%manifest.json" >nul || (echo %R%  [ERROR] Source is not version 1.12.0.%N% & goto :failed)
echo %Y%  The script clones the current GitHub main branch into a NEW temp folder.%N%
echo %Y%  It then overlays release files without deleting GitHub-only files.%N%
echo %Y%  Review changes before committing. Never force-push.%N%
echo.
choice /c YN /n /m "  Continue with fresh clone? [Y/N] "
if errorlevel 2 goto :cancel

echo.
echo %C%  [01/04] Cloning current GitHub main...%N%
git clone --branch main --single-branch "%REPOSITORY%" "%TARGET%"
if errorlevel 1 (echo %R%  [ERROR] Clone failed.%N% & goto :failed)
echo.
echo %C%  [02/04] Overlaying local v1.12.0 project...%N%
robocopy "%SOURCE%" "%TARGET%" /E /R:1 /W:1 /XD .git node_modules /XF PUBLISH-1.12.0.bat COMMIT-PUSH.bat >nul
if errorlevel 8 (echo %R%  [ERROR] File synchronization failed.%N% & goto :failed)
cd /d "%TARGET%" || goto :failed
git add -A
if errorlevel 1 goto :failed
git diff --cached --quiet
if not errorlevel 1 (echo %Y%  [INFO] No changes to publish.%N% & goto :success)
echo.
echo %C%  [03/04] REVIEW ALL CHANGES%N%
git status --short
echo.
git diff --cached --stat
if errorlevel 1 goto :failed
echo.
echo %Y%  Confirm that no unexpected deletions or modifications are present.%N%
choice /c YN /n /m "  Commit exactly these staged files? [Y/N] "
if errorlevel 2 goto :cancel

git -c core.safecrlf=false commit -m "release: synchronize SCREENSHOT v1.12.0 and documentation"
if errorlevel 1 (echo %R%  [ERROR] Commit failed; inspect Git configuration.%N% & goto :failed)
echo.
echo %C%  [04/04] Push to origin/main%N%
choice /c YN /n /m "  Push commit to GitHub main? [Y/N] "
if errorlevel 2 goto :cancel
git push origin main
if errorlevel 1 (echo %R%  [ERROR] Push failed. Local commit remains in %TARGET%%N% & goto :failed)
echo.
echo %G%  [SUCCESS] GitHub main updated to SCREENSHOT 1.12.0.%N%
git log -1 --format="  Commit: %%h - %%s"
goto :success

:cancel
echo.
echo %Y%  [CANCELLED] No additional changes published.%N%
goto :success
:failed
echo.
echo %R%  [FAILED] No force-push was attempted.%N%
echo   Temporary workspace: %TARGET%
pause
exit /b 1
:success
echo.
echo   Temporary workspace: %TARGET%
pause
exit /b 0
