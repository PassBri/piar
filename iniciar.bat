@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ========================================
echo    Iniciando PIAR...
echo ========================================
echo.
echo [1/3] Levantando la base de datos (Docker)...
docker compose up -d db
echo.
echo [2/3] Abriendo el backend (puerto 4000)...
start "PIAR - Backend" cmd /k "cd /d %~dp0server && npm run dev"
timeout /t 4 >nul
echo [3/3] Abriendo el frontend (puerto 5173)...
start "PIAR - Frontend" cmd /k "cd /d %~dp0client && npm run dev"
timeout /t 7 >nul
echo.
echo Abriendo PIAR en el navegador...
start "" http://localhost:5173
echo.
echo ========================================
echo    Listo. Se abrieron dos ventanas:
echo    - PIAR - Backend
echo    - PIAR - Frontend
echo    NO las cierres mientras uses PIAR.
echo ========================================
timeout /t 6 >nul
