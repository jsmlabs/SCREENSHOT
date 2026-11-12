@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "PAUSE_ON_EXIT=1"
if /i "%~1"=="--no-pause" set "PAUSE_ON_EXIT=0"

set "ESC="
set "RESET="
set "MUTED="
set "WHITE="
set "CYAN="
set "BLUE="
set "GREEN="
set "RED="
set "BOLD="

if defined NO_COLOR goto :start
for /f %%E in ('echo prompt $E ^| cmd /d') do set "ESC=%%E"
if not defined ESC goto :start

set "RESET=%ESC%[0m"
set "MUTED=%ESC%[90m"
set "WHITE=%ESC%[97m"
set "CYAN=%ESC%[96m"
set "BLUE=%ESC%[94m"
set "GREEN=%ESC%[92m"
set "RED=%ESC%[91m"
set "BOLD=%ESC%[1m"

:start
title SCREENSHOT - Git Pull Console
set "EXIT_CODE=1"
set "PUSHED_DIR="
set "PULL_SCRIPT_EXCLUDE=:(top,exclude,literal)GIT-PULL.bat"
call :banner

echo %BOLD%%BLUE%  01  REPOSITORY CHECK%RESET%
where git >nul 2>&1 || (
    call :fail "Git is required and must be available on PATH."
    goto :finish
)

pushd "%~dp0" || (
    call :fail "Could not open the script directory."
    goto :finish
)
set "PUSHED_DIR=1"

if not exist ".git" (
    call :fail "Place this script in the root of a Git checkout."
    echo %MUTED%  For a ZIP installation, download and extract the latest copy.%RESET%
    goto :finish
)

git symbolic-ref --quiet HEAD >nul 2>&1 || (
    call :fail "Check out a branch before pulling."
    goto :finish
)

git rev-parse --verify --quiet "@{upstream}" >nul 2>&1 || (
    call :fail "The current branch has no available upstream."
    echo %MUTED%  Configure a tracking branch and try again.%RESET%
    goto :finish
)

echo %GREEN%  [OK] Git checkout and upstream detected.%RESET%
echo.
echo %MUTED%  BRANCH%RESET%
git branch --show-current
echo %MUTED%  UPSTREAM%RESET%
git rev-parse --abbrev-ref --symbolic-full-name "@{upstream}"

call :rule
echo %BOLD%%BLUE%  02  WORKING TREE%RESET%

git status --porcelain -u -- . "%PULL_SCRIPT_EXCLUDE%" >nul || (
    call :fail "Could not inspect the working tree."
    goto :finish
)

for /f "delims=" %%L in ('git status --porcelain -u -- . "%PULL_SCRIPT_EXCLUDE%"') do goto :dirty

set "BEFORE="
for /f %%H in ('git rev-parse HEAD') do set "BEFORE=%%H"
if not defined BEFORE (
    call :fail "Could not read the current commit."
    goto :finish
)

echo %GREEN%  [OK] No local changes outside GIT-PULL.bat.%RESET%
echo %MUTED%  Current commit    %RESET%%WHITE%%BEFORE:~0,12%%RESET%

call :rule
echo %BOLD%%BLUE%  03  REMOTE SYNCHRONIZATION%RESET%
echo %CYAN%  Pulling from the configured upstream ^(fast-forward only^)...%RESET%
echo.

git pull --no-rebase --ff-only
set "EXIT_CODE=%ERRORLEVEL%"
if not "%EXIT_CODE%"=="0" goto :pull_failed

set "AFTER="
for /f %%H in ('git rev-parse HEAD') do set "AFTER=%%H"
if not defined AFTER (
    set "EXIT_CODE=1"
    call :fail "Pull completed, but the resulting commit could not be read."
    goto :finish
)

call :rule
if "%BEFORE%"=="%AFTER%" (
    echo %BOLD%%GREEN%  [OK] NO INCOMING COMMITS APPLIED%RESET%
    echo %MUTED%  Current commit    %RESET%%WHITE%%AFTER:~0,12%%RESET%
) else (
    echo %BOLD%%GREEN%  [SUCCESS] BRANCH UPDATED%RESET%
    echo %MUTED%  Previous commit   %RESET%%WHITE%%BEFORE:~0,12%%RESET%
    echo %MUTED%  Current commit    %RESET%%WHITE%%AFTER:~0,12%%RESET%
)
goto :finish

:dirty
call :fail "Local changes detected outside GIT-PULL.bat."
echo %MUTED%  Commit or stash the changes listed below before pulling.%RESET%
echo.
git status --short -u -- . "%PULL_SCRIPT_EXCLUDE%"
goto :finish

:pull_failed
call :fail "Pull failed. See the Git output above for details."
echo %MUTED%  Common causes include divergent branches and overlapping local edits.%RESET%
goto :finish

:banner
echo %CYAN%  ================================================================================%RESET%
echo %BOLD%%WHITE%     S C R E E N S H O T     /     G I T   P U L L%RESET%
echo %MUTED%     Source control console                                   jsmlabs / GitHub%RESET%
echo %CYAN%  ================================================================================%RESET%
echo.
exit /b 0

:rule
echo.
echo %MUTED%  --------------------------------------------------------------------------------%RESET%
echo.
exit /b 0

:fail
echo.
echo %BOLD%%RED%  [ERROR] %~1%RESET%
exit /b 0

:finish
if defined PUSHED_DIR popd
if "%PAUSE_ON_EXIT%"=="0" goto :return
echo.
echo %MUTED%  Press any key to close this window.%RESET%
pause >nul

:return
endlocal & exit /b %EXIT_CODE%