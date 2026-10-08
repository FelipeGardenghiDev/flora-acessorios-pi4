@echo off
chcp 65001 > nul
echo ========================================================
echo   Iniciando o ecossistema Flora Acessorios 4.0
echo ========================================================
echo.

cd /d "%~dp0"

REM 1. Verifica e instala dependencias do Back-end se necessario
if not exist "%~dp0back-end\node_modules" (
    echo Instalando dependencias do back-end pela primeira vez...
    cd /d "%~dp0back-end"
    call npm install
    cd /d "%~dp0"
)

REM 2. Verifica e instala dependencias do Front-end se necessario
if not exist "%~dp0front-end\node_modules" (
    echo Instalando dependencias do front-end pela primeira vez...
    cd /d "%~dp0front-end"
    call npm install
    cd /d "%~dp0"
)

echo Iniciando o Back-end...
start "Flora - Back-end" cmd /k "cd /d \"%~dp0back-end\" && npm run dev"

echo Iniciando o Front-end...
start "Flora - Front-end" cmd /k "cd /d \"%~dp0front-end\" && npm run dev"

echo.
echo Servicos iniciados com sucesso! Fechando launcher...
timeout /t 2 > nul
exit
