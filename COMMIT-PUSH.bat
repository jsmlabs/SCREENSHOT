@echo off
setlocal EnableExtensions DisableDelayedExpansion
chcp 65001 >nul 2>&1
cd /d "%~dp0" || goto :fatal

rem ANSI styling for modern Windows Terminal and Windows 10/11 consoles.
for /f %%E in ('echo prompt $E ^| cmd') do set "ESC=%%E"
set "RESET=%ESC%[0m"
set "MUTED=%ESC%[90m"
set "WHITE=%ESC%[97m"
set "CYAN=%ESC%[96m"
set "BLUE=%ESC%[94m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "RED=%ESC%[91m"
set "BOLD=%ESC%[1m"
title SCREENSHOT  -  Git Publish Console
mode con: cols=88 lines=36 >nul 2>&1
cls
call :banner

where git >nul 2>&1 || (call :fail "Git is not installed or not available in PATH." & goto :end_failure)
git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 (
  call :rule
  echo %BOLD%%YELLOW%  SETUP  /  ZIP OR EXTRACTED FOLDER DETECTED%RESET%
  echo.
  echo %MUTED%  This directory has no Git history. Your existing files will be kept.%RESET%
  echo %MUTED%  Git will connect this folder to the latest origin/main snapshot.%RESET%
  echo %YELLOW%  [!] Files absent from this folder may appear as deletions.%RESET%
  echo %YELLOW%  [!] Review the staged summary before committing.%RESET%
  echo.
  choice /c YN /n /m "  Connect this folder to jsmlabs/SCREENSHOT? [Y/N] "
  if errorlevel 2 goto :cancel
  echo.
  echo %CYAN%  Initializing local Git metadata...%RESET%
  git init -q
  if errorlevel 1 (call :fail "Git initialization failed." & goto :end_failure)
  git remote add origin https://github.com/jsmlabs/SCREENSHOT.git
  if errorlevel 1 (call :fail "Could not configure origin remote." & goto :end_failure)
  echo %CYAN%  Fetching remote history...%RESET%
  git fetch origin main
  if errorlevel 1 (call :fail "Fetch failed. Check internet access and authentication." & goto :end_failure)
  rem --mixed changes HEAD/index only; it does not overwrite or delete working files.
  git reset --mixed origin/main
  if errorlevel 1 (call :fail "Could not align local Git index with origin/main." & goto :end_failure)
  git branch -M main
  if errorlevel 1 (call :fail "Could not set the local branch to main." & goto :end_failure)
  echo %GREEN%  [OK] Repository connected. Existing files preserved.%RESET%
  echo.
)

for /f "delims=" %%R in ('git rev-parse --show-toplevel 2^>nul') do set "ROOT=%%R"
for %%R in ("%ROOT%") do set "ROOT=%%~fR"
for %%R in ("%CD%") do set "HERE=%%~fR"
if /i not "%ROOT%"=="%HERE%" (call :fail "Place this script in the repository root." & goto :end_failure)

for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "REMOTE=%%R"
if not defined REMOTE (
  call :rule
  echo %BOLD%%YELLOW%  REPAIR  /  MISSING ORIGIN REMOTE%RESET%
  echo %MUTED%  Local Git metadata exists, but no origin remote is configured.%RESET%
  echo %MUTED%  The current working files will not be overwritten.%RESET%
  echo.
  choice /c YN /n /m "  Add origin for jsmlabs/SCREENSHOT? [Y/N] "
  if errorlevel 2 goto :cancel
  git remote add origin https://github.com/jsmlabs/SCREENSHOT.git
  if errorlevel 1 (call :fail "Could not add origin for jsmlabs/SCREENSHOT." & goto :end_failure)
  for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "REMOTE=%%R"
  if not defined REMOTE (call :fail "Origin still unavailable after setup." & goto :end_failure)
  git rev-parse --verify HEAD >nul 2>&1
  if errorlevel 1 (
    echo %CYAN%  No local commits found. Retrieving GitHub history...%RESET%
    git fetch origin main
    if errorlevel 1 (call :fail "Fetch failed. Check internet access and authentication." & goto :end_failure)
    git reset --mixed origin/main
    if errorlevel 1 (call :fail "Could not establish the local baseline." & goto :end_failure)
    git branch -M main
    if errorlevel 1 (call :fail "Could not select the main branch." & goto :end_failure)
    echo %GREEN%  [OK] Local Git history repaired. Working files preserved.%RESET%
  )
  echo %GREEN%  [OK] Origin remote is now configured.%RESET%
  echo.
)

set "REMOTE_OK="
if /i "%REMOTE%"=="https://github.com/jsmlabs/SCREENSHOT" set "REMOTE_OK=1"
if /i "%REMOTE%"=="https://github.com/jsmlabs/SCREENSHOT.git" set "REMOTE_OK=1"
if /i "%REMOTE%"=="git@github.com:jsmlabs/SCREENSHOT.git" set "REMOTE_OK=1"
if /i "%REMOTE%"=="ssh://git@github.com/jsmlabs/SCREENSHOT.git" set "REMOTE_OK=1"
if not defined REMOTE_OK (call :fail "Origin does not match github.com/jsmlabs/SCREENSHOT." & echo %MUTED%  Actual: %REMOTE%%RESET% & goto :end_failure)

for /f "delims=" %%B in ('git symbolic-ref --quiet --short HEAD 2^>nul') do set "BRANCH=%%B"
if not defined BRANCH (call :fail "Detached HEAD: check out a branch before publishing." & goto :end_failure)

rem Refresh GitHub before staging so stale local branches do not publish over newer history.
call :rule
echo %BOLD%%BLUE%  00  REMOTE SYNCHRONIZATION%RESET%
git fetch origin "%BRANCH%"
if errorlevel 1 (call :fail "Cannot fetch GitHub updates. Publish aborted." & goto :end_failure)
git rev-parse --verify "origin/%BRANCH%" >nul 2>&1
if errorlevel 1 (call :fail "Remote branch could not be verified." & goto :end_failure)
git merge-base --is-ancestor "origin/%BRANCH%" HEAD
if errorlevel 1 (
  git merge-base --is-ancestor HEAD "origin/%BRANCH%"
  if errorlevel 1 (
    call :fail "Local and remote branches diverged. Resolve commits manually."
    echo %MUTED%  Inspect: git log --oneline --graph --all -15%RESET%
    goto :end_failure
  )
  echo %YELLOW%  [!] Remote has newer commits. Local working files will be preserved.%RESET%
  echo %MUTED%  Aligning HEAD and index does not replace local files.%RESET%
  choice /c YN /n /m "  Synchronize history with origin? [Y/N] "
  if errorlevel 2 goto :cancel
  git reset --mixed "origin/%BRANCH%"
  if errorlevel 1 (call :fail "Could not synchronize local Git history." & goto :end_failure)
  echo %GREEN%  [OK] Remote history aligned. Existing files preserved.%RESET%
) else (
  echo %GREEN%  [OK] Local Git history includes origin.%RESET%
)

echo.
echo %MUTED%  REPOSITORY%RESET%  %WHITE%jsmlabs/SCREENSHOT%RESET%
echo %MUTED%  BRANCH    %RESET%  %CYAN%%BRANCH%%RESET%
echo %MUTED%  LOCATION  %RESET%  %HERE%
echo %MUTED%  REMOTE    %RESET%  %REMOTE%

call :rule
echo %BOLD%%BLUE%  01  WORKING TREE%RESET%
echo %MUTED%  Changes include untracked files. Review carefully before continuing.%RESET%
echo.
git status --short
if errorlevel 1 (call :fail "Could not read working tree status." & goto :end_failure)
echo.
git status --porcelain -u >nul 2>&1
if errorlevel 1 (call :fail "Could not inspect working tree." & goto :end_failure)
set "HAS_CHANGES="
for /f "delims=" %%S in ('git status --porcelain -u') do set "HAS_CHANGES=1"
if not defined HAS_CHANGES (
  echo %GREEN%  [OK] No local changes to commit.%RESET%
  echo %MUTED%  You can still publish existing local commits.%RESET%
  goto :push_prompt
)

rem Protect repository-critical files from accidental ZIP-sync deletion.
if not exist ".gitignore" (
  echo %RED%  [BLOCKED] .gitignore is missing. Run: git restore -- .gitignore%RESET%
  goto :end_failure
)
if not exist "LICENSE" (
  echo %RED%  [BLOCKED] LICENSE is missing. Run: git restore -- LICENSE%RESET%
  goto :end_failure
)

echo %YELLOW%  [!] Staging all changes with git add -A, including deletions.%RESET%
choice /c YN /n /m "  Stage and commit these changes? [Y/N] "
if errorlevel 2 goto :cancel

git add -A
if errorlevel 1 (call :fail "Staging failed. Nothing was committed." & goto :end_failure)
call :rule
echo %BOLD%%BLUE%  02  STAGED REVIEW%RESET%
git diff --cached --stat
if errorlevel 1 (call :fail "Could not inspect staged changes." & goto :end_failure)
git diff --cached --quiet
if errorlevel 1 (
  echo.
  choice /c YN /n /m "  Commit the staged changes? [Y/N] "
  if errorlevel 2 goto :cancel
  goto :commit_prompt
)
echo %YELLOW%  [!] No staged differences found.%RESET%
goto :push_prompt

:commit_prompt
set "COMMIT_MESSAGE="
set /p "COMMIT_MESSAGE=  Commit message: "
if not defined COMMIT_MESSAGE (call :fail "A non-empty commit message is required." & goto :end_failure)
echo.
echo %CYAN%  Publishing commit...%RESET%
git commit -m "%COMMIT_MESSAGE%"
if errorlevel 1 (call :fail "Commit failed. Changes remain local." & goto :end_failure)
echo %GREEN%  [OK] Commit created.%RESET%

:push_prompt
call :rule
echo %BOLD%%BLUE%  03  REMOTE PUBLISH%RESET%
git status -sb
if errorlevel 1 (call :fail "Could not inspect branch status." & goto :end_failure)
echo.
git merge-base --is-ancestor HEAD "origin/%BRANCH%"
if errorlevel 2 (call :fail "Could not compare local and remote history." & goto :end_failure)
if not errorlevel 1 (
  echo %GREEN%  [OK] No local commits to push.%RESET%
  goto :end_success
)

echo %YELLOW%  [!] Push will publish local commits to origin/%BRANCH%.%RESET%
choice /c YN /n /m "  Push now? [Y/N] "
if errorlevel 2 goto :cancel

echo.
echo %CYAN%  Refreshing GitHub state before push...%RESET%
git fetch origin "%BRANCH%"
if errorlevel 1 (call :fail "Cannot verify remote updates. Push aborted." & goto :end_failure)
git merge-base --is-ancestor "origin/%BRANCH%" HEAD
if errorlevel 1 (
  call :fail "GitHub moved ahead. Push aborted to protect remote commits."
  goto :end_failure
)

echo %CYAN%  Connecting to GitHub...%RESET%
git push -u origin HEAD
if errorlevel 1 (
  call :fail "Push failed. Your local commit is preserved."
  echo %MUTED%  Check authentication, permissions, and remote updates; never force-push blindly.%RESET%
  goto :end_failure
)

call :rule
echo %BOLD%%GREEN%  [SUCCESS] PUBLISHED TO GITHUB%RESET%
echo %MUTED%  Repository: %RESET%https://github.com/jsmlabs/SCREENSHOT
echo %MUTED%  Branch:     %RESET%%BRANCH%
for /f "delims=" %%H in ('git rev-parse --short HEAD 2^>nul') do echo %MUTED%  Commit:     %RESET%%%H
echo.
git status -sb
goto :end_success

:banner
echo %CYAN%  ================================================================================%RESET%
echo %BOLD%%WHITE%     S C R E E N S H O T     /     G I T   P U B L I S H%RESET%
echo %MUTED%     Source control console                                   jsmlabs / GitHub%RESET%
echo %CYAN%  ================================================================================%RESET%
echo.
exit /b

:rule
echo.
echo %MUTED%  --------------------------------------------------------------------------------%RESET%
echo.
exit /b

:fail
echo.
echo %BOLD%%RED%  [ERROR] %~1%RESET%
exit /b

:cancel
echo.
echo %YELLOW%  [CANCELLED] No further actions were performed.%RESET%
goto :end_success

:fatal
echo [ERROR] Could not open the script directory.
goto :end_failure

:end_failure
echo.
echo %MUTED%  Press any key to close this window.%RESET%
pause >nul
exit /b 1

:end_success
echo.
echo %MUTED%  Press any key to close this window.%RESET%
pause >nul
exit /b 0