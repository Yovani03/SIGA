const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
// Permitimos CORS para que nuestro React (en el puerto 5173 o similar) pueda comunicarse con este agente
app.use(cors());

app.get('/api/scan', (req, res) => {
    // Aquí definimos que escanee como PDF y lo guarde temporalmente en esta misma carpeta
    const outputPath = path.join(__dirname, 'temp_scan.pdf');
    
    // Si ya había un escaneo viejo, lo borramos
    if (fs.existsSync(outputPath)) {
        fs.unlinkSync(outputPath);
    }

    // Obtenemos el perfil de la query string, o usamos "Brother" por defecto
    const profile = req.query.profile || 'Brother';

    console.log(`-> Recibida orden desde la Web. Iniciando escáner con perfil: ${profile}...`);
    
    // Ejecutamos NAPS2 por línea de comandos usando el perfil seleccionado
    const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files';
    const command = `"${programFiles}\\NAPS2\\naps2.console.exe" -p "${profile}" -o "${outputPath}"`;

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar escaner: ${error.message}`);
            return res.status(500).json({ error: `No se pudo activar el escáner. Verifica que esté encendido y el perfil se llame "${profile}".` });
        }
        
        console.log("-> Escaneo completado con éxito.");
        
        // Comprobamos que el archivo se creó correctamente
        if (fs.existsSync(outputPath)) {
            // Enviamos el PDF directamente como respuesta al navegador
            res.sendFile(outputPath);
        } else {
            res.status(500).json({ error: 'El escaner funcionó pero no se pudo leer el archivo generado.' });
        }
    });
});

const PORT = 3001; // El agente local vivirá en el puerto 3001
app.listen(PORT, () => {
    console.log('===================================================');
    console.log(`🤖 AGENTE LOCAL DE ESCANEO INICIADO`);
    console.log(`📡 Escuchando ordenes en: http://localhost:${PORT}`);
    console.log(`⚠️  Por favor, mantén esta ventana abierta.`);
    console.log('===================================================');
});
