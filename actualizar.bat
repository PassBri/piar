@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo    Actualizando PIAR...
echo ========================================
echo.
echo [1/5] Deteniendo procesos...
taskkill /F /IM node.exe >nul 2>&1
echo [2/5] Trayendo los ultimos cambios de GitHub...
git pull
echo [3/5] Recreando la base de datos (con datos nuevos)...
docker compose down -v
docker compose up -d db
echo [4/5] Instalando dependencias nuevas...
call npm --prefix server install
call npm --prefix client install
echo [5/5] Iniciando PIAR...
timeout /t 3 >nul
start "PIAR - Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 4 >nul
start "PIAR - Frontend" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 8 >nul
start "" http://localhost:5173
echo.
echo ========================================
echo    Listo. PIAR actualizado y corriendo.
echo    No cierres las dos ventanas negras.
echo ========================================
timeout /t 6 >nul
