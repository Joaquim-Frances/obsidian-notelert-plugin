#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Ruta del plugin en Obsidian
const OBSIDIAN_PLUGIN_PATH = '/Users/quimfrances/Documents/arca2026/.obsidian/plugins/obsidian-notelert-plugin';

// Archivos a copiar
const FILES_TO_COPY = ['main.js', 'manifest.json'];

// Ruta de origen (dist/)
const DIST_PATH = path.join(__dirname, '..', 'dist');

console.log('📦 Copiando archivos a Obsidian...\n');

// Verificar que existe la carpeta dist
if (!fs.existsSync(DIST_PATH)) {
  console.error('❌ Error: La carpeta dist/ no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

// Verificar que existe la carpeta de destino
if (!fs.existsSync(OBSIDIAN_PLUGIN_PATH)) {
  console.error(`❌ Error: La carpeta de destino no existe: ${OBSIDIAN_PLUGIN_PATH}`);
  console.log('💡 Crea la carpeta manualmente o verifica la ruta.');
  process.exit(1);
}

// Copiar archivos
let copiedCount = 0;
let errors = [];

FILES_TO_COPY.forEach(file => {
  const sourcePath = path.join(DIST_PATH, file);
  const destPath = path.join(OBSIDIAN_PLUGIN_PATH, file);

  // Verificar que el archivo fuente existe
  if (!fs.existsSync(sourcePath)) {
    const error = `❌ Error: ${file} no existe en dist/`;
    console.error(error);
    errors.push(error);
    return;
  }

  try {
    // Copiar el archivo
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✅ Copiado: ${file}`);
    copiedCount++;
  } catch (error) {
    const errorMsg = `❌ Error copiando ${file}: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }
});

// Mostrar resultado
console.log('\n' + '='.repeat(50));
if (errors.length === 0 && copiedCount === FILES_TO_COPY.length) {
  console.log('✅ ¡Archivos copiados correctamente!');
  console.log(`📁 Destino: ${OBSIDIAN_PLUGIN_PATH}`);
  console.log(`📊 Archivos copiados: ${copiedCount}/${FILES_TO_COPY.length}`);
  
  // Mostrar notificación del sistema (macOS)
  const notification = `osascript -e 'display notification "✅ Plugin Notelert actualizado correctamente\\n${copiedCount} archivos copiados" with title "Build Completado"'`;
  exec(notification, (error) => {
    if (error) {
      // Si falla la notificación, no es crítico
      console.log('\n💡 Recarga el plugin en Obsidian para ver los cambios.');
    }
  });
  
  console.log('\n💡 Recarga el plugin en Obsidian:');
  console.log('   Configuración → Plugins → Desactivar/Activar Notelert');
} else {
  console.error('❌ Hubo errores al copiar los archivos:');
  errors.forEach(error => console.error(`   ${error}`));
  process.exit(1);
}
