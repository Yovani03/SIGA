@echo off
echo ===================================================
echo Iniciando Agente de Escaner...
echo ===================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar_escaner.ps1"
pause
