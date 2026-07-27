@echo off
title Manga Studio Runner
color 0b
cls

echo =====================================================================
echo                 MANGA STUDIO DEV-ENVIRONMENT RUNNER                 
echo =====================================================================
echo.

:: Check for dotnet
where dotnet >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] .NET SDK is not installed or not in PATH.
    echo Please install .NET SDK to run the Backend.
    goto error
)

:: Check for node
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0c
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js to run the Frontend.
    goto error
)

set FRONTEND_DIR=%~dp0Front-end
set BACKEND_DIR=%~dp0Back-end\MangaStudio.Backend

echo [+] Starting Backend (.NET Web API)...
echo     Swagger: http://localhost:64112/swagger
echo.
start "Manga Studio - Backend" cmd /k "cd /d "%BACKEND_DIR%" && dotnet run"

echo [+] Starting Frontend (Next.js)...
echo     Frontend URL: http://localhost:3000
echo.
start "Manga Studio - Frontend" cmd /k "cd /d "%FRONTEND_DIR%" && (if not exist node_modules (echo [INFO] node_modules not found. Installing dependencies, please wait... && npm install) else (echo [INFO] node_modules folder exists.)) && npm run dev"


color 0a
echo =====================================================================
echo   SUCCESS: Both services have been launched in separate windows!     
echo.
echo   - Backend:  http://localhost:64112/swagger (or https://localhost:64111/swagger)
echo   - Frontend: http://localhost:3000
echo.
echo   * Keep this window open or close it. Close the spawned windows to
echo     stop the respective service.
echo =====================================================================
pause
exit

:error
echo.
echo Please resolve the issues above and try again.
pause
