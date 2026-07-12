const { spawn } = require('child_process');
const path = require('path');

async function start() {
  console.log('🚀 Iniciando entorno LocalEcomer...');

  // Obtener puerto desde argumentos o usar 3000 por defecto
  const args = process.argv.slice(2);
let port = '3002';
let nextArgs = ['next', 'dev'];
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' || args[i] === '--port') {
      if (args[i + 1]) {
        port = args[i + 1];
        i++;
      }
    } else {
      nextArgs.push(args[i]);
    }
  }
  
  // Añadir el puerto a los argumentos de Next.js
  nextArgs.push('-p', port);

  // Levantar Next.js dev server
  console.log(`⚡ Iniciando servidor de Next.js en el puerto ${port}...`);
  const nextProcess = spawn('npx', nextArgs, {
    stdio: 'inherit',
    shell: true
  });

  nextProcess.on('close', (code) => {
    process.exit(code);
  });
}

start().catch(console.error);
