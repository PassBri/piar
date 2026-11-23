@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Deteniendo PIAR...
taskkill /F /IM node.exe >nul 2>&1
docker compose stop
echo.
echo PIAR detenido. Ya puedes cerrar esta ventana.
timeout /t 4 >nul
