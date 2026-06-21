const { spawn, execSync } = require('child_process');
const net = require('net');
const path = require('path');

const PYTHON_PORT = 8000;
const PYTHON_SERVER_PATH = '/home/jerson/Escritorio/programador-de-mundos/backend/server.py';

// Función para verificar si un puerto está ocupado
function isPortOccupied(port) {
  return new Promise((resolve) => {
    const server = net.createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      })
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

async function start() {
  console.log('🚀 Iniciando entorno LocalEcomer + XuperBrain...');

  // 1. Verificar si el servidor Python de XuperBrain ya está en ejecución
  const pythonRunning = await isPortOccupied(PYTHON_PORT);

  if (pythonRunning) {
    console.log(`✅ Servidor Python (XuperBrain) detectado activo en el puerto ${PYTHON_PORT}.`);
  } else {
    console.log(`⚙️ Levando servidor Python (XuperBrain) en el puerto ${PYTHON_PORT}...`);
    
    // Ejecutar el script server.py en segundo plano
    const pythonProcess = spawn('python3', [PYTHON_SERVER_PATH], {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(PYTHON_SERVER_PATH)
    });

    pythonProcess.unref();

    // Esperar a que el puerto 8000 esté listo
    let retries = 0;
    while (retries < 10) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (await isPortOccupied(PYTHON_PORT)) {
        console.log('✅ XuperBrain levantado con éxito y en línea.');
        break;
      }
      retries++;
    }
    
    if (retries === 10) {
      console.log('⚠️ Advertencia: No se pudo verificar si XuperBrain está activo, continuando con Next.js...');
    }
  }

  // 2. Levantar Next.js dev server
  console.log('⚡ Iniciando servidor de Next.js...');
  const nextProcess = spawn('npx', ['next', 'dev', '-p', '3004'], {
    stdio: 'inherit',
    shell: true
  });

  nextProcess.on('close', (code) => {
    process.exit(code);
  });
}

start().catch(console.error);
