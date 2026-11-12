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
git rev-parse --is-inside-work-tree >nul 2>&1 || (call :fail "This folder is not a Git working tree. Clone the repository first." & goto :end_failure)
for /f "delims=" %%R in ('git rev-parse --show-toplevel 2^>nul') do set "ROOT=%%R"
for %%R in ("%ROOT%") do set "ROOT=%%~fR"
for %%R in ("%CD%") do set "HERE=%%~fR"
if /i not "%ROOT%"=="%HERE%" (call :fail "Place this script in the repository root." & goto :end_failure)

for /f "delims=" %%R in ('git remote get-url origin 2^>nul') do set "REMOTE=%%R"
if not defined REMOTE (call :fail "The origin remote is missing." & goto :end_failure)
set "REMOTE_OK="
if /i "%REMOTE%"=="https://github.com/jsmlabs/SCREENSHOT" set "REMOTE_OK=1"
if /i "%REMOTE%"=="https://github.com/jsmlabs/SCREENSHOT.git" set "REMOTE_OK=1"
if /i "%REMOTE%"=="git@github.com:jsmlabs/SCREENSHOT.git" set "REMOTE_OK=1"
if /i "%REMOTE%"=="ssh://git@github.com/jsmlabs/SCREENSHOT.git" set "REMOTE_OK=1"
if not defined REMOTE_OK (call :fail "Origin does not match github.com/jsmlabs/SCREENSHOT." & echo %MUTED%  Actual: %REMOTE%%RESET% & goto :end_failure)

for /f "delims=" %%B in ('git symbolic-ref --quiet --short HEAD 2^>nul') do set "BRANCH=%%B"
if not defined BRANCH (call :fail "Detached HEAD: check out a branch before publishing." & goto :end_failure)

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
git status --porcelain --untracked-files=normal >nul 2>&1
if errorlevel 1 (call :fail "Could not inspect working tree." & goto :end_failure)
for /f %%N in ('git status --porcelain --untracked-files=normal ^| find /c /v ""') do set "CHANGE_COUNT=%%N"
if "%CHANGE_COUNT%"=="0" (
  echo %GREEN%  [OK] No local changes to commit.%RESET%
  echo %MUTED%  You can still publish existing local commits.%RESET%
  goto :push_prompt
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
echo %YELLOW%  [!] Push will publish local commits to origin/%BRANCH%.%RESET%
choice /c YN /n /m "  Push now? [Y/N] "
if errorlevel 2 goto :cancel

echo.
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
