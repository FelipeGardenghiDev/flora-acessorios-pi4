@echo off
chcp 65001 > nul
echo ========================================================
echo   Flora Acessorios 4.0 - Criando Banco de Dados MySQL
echo ========================================================
echo.

set MYSQL_PATH=C:\xampp\mysql\bin\mysql.exe

if not exist "%MYSQL_PATH%" (
    echo [ERRO] MySQL nao encontrado em C:\xampp\mysql\bin\mysql.exe
    echo Certifique-se de que o XAMPP esta instalado em C:\xampp.
    echo.
    pause
    exit /b 1
)

echo Conectando ao MySQL e aplicando estrutura (schema)...
"%MYSQL_PATH%" -u root --default-character-set=utf8mb4 < "%~dp0database\schema.sql"
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao executar o schema.sql.
    echo Verifique se o MySQL esta iniciado e verde no painel do XAMPP.
    echo.
    pause
    exit /b 1
)

echo Aplicando dados iniciais (seed)...
"%MYSQL_PATH%" -u root --default-character-set=utf8mb4 < "%~dp0database\seed.sql"
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Falha ao executar o seed.sql.
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================================
echo   Banco pronto
echo ========================================================
echo.
pause
