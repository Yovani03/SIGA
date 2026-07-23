# Agente local de escaneo en PowerShell
# Este script levanta un servidor HTTP local en el puerto 3001
# No requiere Node.js ni instalar dependencias de npm.

$port = 3001
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
} catch {
    Write-Error "No se pudo iniciar el servidor en el puerto $port. Verifica si ya esta en uso o si tienes otra ventana del agente abierta."
    Read-Host "Presiona Enter para salir..."
    exit
}

Write-Host "==================================================="
Write-Host "AGENTE LOCAL DE ESCANEO INICIADO (PowerShell)"
Write-Host "Escuchando ordenes en: http://localhost:$port"
Write-Host "Por favor, manten esta ventana abierta."
Write-Host "==================================================="

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Encabezados CORS obligatorios
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type")

        # Responder a la peticion OPTIONS pre-flight
        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        if ($request.Url.LocalPath -eq "/api/scan") {
            # Extract profile from query parameter
            $profile = "Brother"
            if ($request.Url.Query -match "profile=([^&]+)") {
                $profile = $matches[1]
            }

            Write-Host "-> Recibida orden desde la Web. Iniciando escaner con perfil $profile..."
            
            # Definir la ruta del archivo de salida
            $outputPath = Join-Path $PSScriptRoot "temp_scan.pdf"
            if (Test-Path $outputPath) {
                Remove-Item $outputPath -Force
            }

            # Encontrar la ruta de NAPS2
            $programFiles = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFiles)
            $napsPath = Join-Path $programFiles "NAPS2\naps2.console.exe"
            
            if (-not (Test-Path $napsPath)) {
                # Alternativa en x86
                $programFilesX86 = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::ProgramFilesX86)
                $napsPath = Join-Path $programFilesX86 "NAPS2\naps2.console.exe"
            }

            if (-not (Test-Path $napsPath)) {
                $errMsg = "No se encontro NAPS2 instalado. Por favor descarga e instala NAPS2."
                Write-Host "Error: $errMsg" -ForegroundColor Red
                
                $response.StatusCode = 500
                $response.ContentType = "application/json"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes('{"error": "' + $errMsg + '"}')
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
                $response.Close()
                continue
            }

            # Ejecutar el escaneo usando el perfil
            Write-Host "Ejecutando NAPS2..."
            $process = Start-Process -FilePath $napsPath -ArgumentList "-p `"$profile`"", "-o `"$outputPath`"" -NoNewWindow -PassThru -Wait

            if (Test-Path $outputPath) {
                Write-Host "-> Escaneo completado con exito."
                $response.StatusCode = 200
                $response.ContentType = "application/pdf"
                
                $bytes = [System.IO.File]::ReadAllBytes($outputPath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                Write-Host "Error: El escaner no pudo generar el archivo PDF." -ForegroundColor Red
                $response.StatusCode = 500
                $response.ContentType = "application/json"
                $buffer = [System.Text.Encoding]::UTF8.GetBytes('{"error": "El escaner no pudo generar el archivo. Asegurate de que este encendido y que el perfil se llame Brother."}')
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            }
        } else {
            $response.StatusCode = 404
            $response.ContentType = "text/plain"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
            $response.ContentLength64 = $buffer.Length
            $response.OutputStream.Write($buffer, 0, $buffer.Length)
        }
        
        $response.Close()
    }
} catch {
    Write-Host "Ocurrio un error en el servidor: $_" -ForegroundColor Red
} finally {
    $listener.Stop()
}
