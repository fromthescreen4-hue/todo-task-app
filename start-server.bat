@echo off
title CORE FIT - Build Strength From Within
echo ========================================================
echo   CORE FIT: Production Fitness Web Application
echo   Brand: CORE FIT | Tagline: Build Strength From Within
echo ========================================================
echo.

where npm >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Starting Vite Development Server...
    start http://localhost:3000
    npm run dev
    goto end
)

where npx >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Serving built production bundle...
    start http://localhost:3000
    npx serve dist -l 3000
    goto end
)

where python >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo Launching with Python http.server on port 3000...
    start http://localhost:3000
    python -m http.server 3000 --directory dist
    goto end
)

:end
pause
