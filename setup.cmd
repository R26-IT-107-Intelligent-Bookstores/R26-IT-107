@echo off
setlocal
where py >nul 2>&1
if errorlevel 1 (
    echo Python 3.11 with the Windows Python launcher is required. Install it, then retry.
    exit /b 1
)
py -3.11 "%~dp0scripts\local_dev.py" setup %*
exit /b %errorlevel%
