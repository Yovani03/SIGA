@echo off
chcp 65001 > nul
echo ===================================================
echo Iniciando Agente de Escaner...
echo ===================================================

:: Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no está instalado en esta computadora.
    echo Por favor, descarga e instala Node.js desde: https://nodejs.org/
    echo Se recomienda descargar la versión LTS. Una vez instalada, vuelve a abrir este archivo.
    echo.
    pause
    exit /b
)

:: Moverse al directorio del agente usando la ruta relativa del archivo .bat
cd /d "%~dp0local_scanner_agent"

:: Si no existe la carpeta node_modules, instalar las dependencias automáticamente
if not exist node_modules (
    echo [INFO] No se encontraron las dependencias instaladas. Instalando...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Ocurrió un error al instalar las dependencias del escáner.
        pause
        exit /b
    )
)

:: Iniciar el agente de escaneo
node server.js
pause
