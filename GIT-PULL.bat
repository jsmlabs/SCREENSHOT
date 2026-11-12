@echo off
setlocal EnableExtensions DisableDelayedExpansion
where git >nul 2>&1 || (
    echo [ERROR] Git is required and must be available on PATH. 1>&2
    exit /b 1
)

pushd "%~dp0" || exit /b 1
if not exist ".git" (
    echo [ERROR] Run this script from the root of a Git checkout. 1>&2
    goto :failed
)
git symbolic-ref --quiet HEAD >nul 2>&1 || (
    echo [ERROR] Check out a branch before pulling. 1>&2
    goto :failed
)
git rev-parse --verify --quiet "@{upstream}" >nul 2>&1 || (
    echo [ERROR] The current branch has no available upstream. 1>&2
    goto :failed
)

for /f "delims=" %%L in ('git status --porcelain -u') do (
    echo [ERROR] Commit, stash, or remove local changes before pulling. 1>&2
    goto :failed
)

git pull --no-rebase --ff-only
set "PULL_RESULT=%ERRORLEVEL%"
if not "%PULL_RESULT%"=="0" echo [ERROR] Pull failed. Review the Git output above. 1>&2
popd
exit /b %PULL_RESULT%

:failed
popd
exit /b 1
