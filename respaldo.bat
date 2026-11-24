@echo off
REM Respaldo (backup) de la base de datos PIAR.
REM Crea un archivo respaldo_piar_AAAAMMDD.sql en esta carpeta.
setlocal
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set DT=%%I
set FECHA=%DT:~0,8%
echo Creando respaldo de la base de datos...
docker compose exec -T db pg_dump -U piar piar > respaldo_piar_%FECHA%.sql
if %errorlevel%==0 (
  echo.
  echo Respaldo creado: respaldo_piar_%FECHA%.sql
  echo Guardalo en un lugar seguro ^(USB, nube^).
) else (
  echo.
  echo No se pudo crear el respaldo. Verifica que la base este iniciada ^(iniciar.bat^).
)
echo.
pause
