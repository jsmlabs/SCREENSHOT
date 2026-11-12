@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "PAUSE_ON_EXIT=1"
set "EXIT_CODE=1"
set "PUSHED_DIR="
set "ESC="
set "RESET="
set "BOLD="
set "CYAN="
set "BLUE="
set "GREEN="
set "RED="
set "MUTED="
set "WHITE="

if defined NO_COLOR goto :start
for /f %%E in ('echo prompt $E ^| cmd /d') do set "ESC=%%E"
if not defined ESC goto :start
set "RESET=%ESC%[0m"
set "BOLD=%ESC%[1m"
set "CYAN=%ESC%[96m"
set "BLUE=%ESC%[94m"
set "GREEN=%ESC%[92m"
set "RED=%ESC%[91m"
set "MUTED=%ESC%[90m"
set "WHITE=%ESC%[97m"

:start
title SCREENSHOT - Install Console
echo %CYAN%  ================================================================================%RESET%
echo %BOLD%%WHITE%     S C R E E N S H O T     /     I N S T A L L%RESET%
echo %MUTED%     Unpacked extension setup                               jsmlabs / GitHub%RESET%
echo %CYAN%  ================================================================================%RESET%
echo.

if /i "%~1"=="--no-pause" set "PAUSE_ON_EXIT=0"
echo %BOLD%%BLUE%  01  CHECK EXTENSION FILES%RESET%
pushd "%~dp0" || (
    call :fail "Could not open the installer directory."
    goto :finish
)
set "PUSHED_DIR=1"

for %%F in (
    "manifest.json"
    "_locales\en\messages.json"
    "src\background\background.js"
    "src\popup\popup.html"
    "src\editor\editor.html"
    "src\offscreen\offscreen.html"
) do (
    if not exist "%%~F" (
        call :fail "Missing required file: %%~F"
        echo %MUTED%  Extract the complete project and run INSTALL.bat from that folder.%RESET%
        goto :finish
    )
)
echo %GREEN%  [OK] Required extension files found.%RESET%
echo %MUTED%  Extension folder%RESET%
echo   "%~dp0"

call :rule
echo %BOLD%%BLUE%  02  OPEN EXTENSIONS MANAGER%RESET%
set "BROWSER_EXE="
call :find_browser "chrome.exe" "Google\Chrome\Application"
if not defined BROWSER_EXE goto :find_edge
set "BROWSER_NAME=Google Chrome"
set "EXTENSIONS_URL=chrome://extensions/"
goto :open_browser

:find_edge
call :find_browser "msedge.exe" "Microsoft\Edge\Application"
if not defined BROWSER_EXE (
    call :fail "Chrome or Edge could not be located."
    echo %MUTED%  Open chrome://extensions/ or edge://extensions/ manually.%RESET%
    goto :instructions
)
set "BROWSER_NAME=Microsoft Edge"
set "EXTENSIONS_URL=edge://extensions/"

:open_browser
start "" "%BROWSER_EXE%" "%EXTENSIONS_URL%"
if errorlevel 1 (
    call :fail "Could not start %BROWSER_NAME%."
    echo %MUTED%  Open %EXTENSIONS_URL% manually.%RESET%
    goto :instructions
)
set "EXIT_CODE=0"
echo %GREEN%  [OK] Launch requested for %BROWSER_NAME%.%RESET%

:instructions
call :rule
echo %BOLD%%BLUE%  03  COMPLETE INSTALLATION IN THE BROWSER%RESET%
echo   1. Turn on Developer mode.
echo   2. Select Load unpacked and choose this folder:
echo      "%~dp0"
echo   3. Open a regular website and select SCREENSHOT from the extensions menu.
echo.
echo %MUTED%  Already installed from this folder? Select Reload on the SCREENSHOT card.%RESET%
goto :finish

:find_browser
for %%D in ("%LocalAppData%" "%ProgramFiles%" "%ProgramFiles(x86)%") do (
    if not "%%~D"=="" if exist "%%~D\%~2\%~1" (
        set "BROWSER_EXE=%%~D\%~2\%~1"
        exit /b 0
    )
)
for /f "delims=" %%P in ('where "$PATH:%~1" 2^>nul') do (
    set "BROWSER_EXE=%%P"
    exit /b 0
)
exit /b 1

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
