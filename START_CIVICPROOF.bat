@echo off
setlocal
cd /d "%~dp0"

echo.
echo ========================================
echo   CivicProof AI - Local Development
echo ========================================
echo.

if not exist package.json (
  echo ERROR: package.json was not found.
  echo Open the folder that contains package.json in VS Code.
  pause
  exit /b 1
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Install Node.js 20 LTS from https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm is not available.
  echo Reinstall Node.js 20 LTS and make sure npm is added to PATH.
  pause
  exit /b 1
)

for /f "tokens=1" %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 18 (
  echo ERROR: CivicProof needs Node.js 18 or newer.
  echo Recommended: Node.js 20 LTS.
  pause
  exit /b 1
)

if not exist node_modules\.bin\next.cmd (
  echo Dependencies are not installed yet.
  echo Installing CivicProof dependencies...
  echo.
  call npm install
  if errorlevel 1 (
    echo.
    echo ERROR: npm install failed.
    echo Check your internet connection, then run:
    echo     npm install
    echo.
    pause
    exit /b 1
  )
)

if not exist node_modules\.bin\next.cmd (
  echo ERROR: Next.js was not installed correctly.
  echo Run: npm install
  pause
  exit /b 1
)

if exist .next rmdir /s /q .next >nul 2>nul

echo.
echo Starting CivicProof AI...
echo.
echo Open: http://localhost:3000
echo Keep this window open while using the app.
echo Press Ctrl+C to stop the server.
echo.

call npm run dev
pause
