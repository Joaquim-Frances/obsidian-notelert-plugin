#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// Rutas de prueba del plugin en Obsidian desktop
const DESKTOP_PLUGIN_PATHS = [
  '/Users/quimfrances/Documents/ObsidianRemoteQuim/.obsidian/plugins/notelert',
  '/Users/quimfrances/Documents/Arca2026/.obsidian/plugins/notelert',
  '/Users/quimfrances/Documents/RemoteObsidian/.obsidian/plugins/notelert',
];

// Rutas de prueba del plugin en Obsidian Android emulator
const EMULATOR_PLUGIN_PATHS = [
  '/storage/emulated/0/Documents/ObsidianVault/.obsidian/plugins/notelert',
  '/storage/emulated/0/Documents/ObsidianVault/2026/.obsidian/plugins/notelert',
];

// Archivos a copiar
const FILES_TO_COPY = ['main.js', 'manifest.json', 'styles.css'];

// Ruta de origen (dist/)
const DIST_PATH = path.join(__dirname, '..', 'dist');
const ROOT_PATH = path.join(__dirname, '..');

console.log('📦 Copiando archivos a Obsidian desktop y emulador...\n');

// Verificar que existe la carpeta dist
if (!fs.existsSync(DIST_PATH)) {
  console.error('❌ Error: La carpeta dist/ no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

const getSourcePath = (file) => {
  if (file === 'styles.css') {
    return path.join(ROOT_PATH, file);
  }

  return path.join(DIST_PATH, file);
};

let copiedCount = 0;
let errors = [];

const copyToDesktopPath = (pluginPath) => {
  if (!fs.existsSync(pluginPath)) {
    console.error(`❌ Error: La carpeta de destino no existe: ${pluginPath}`);
    errors.push(`Destino no existe: ${pluginPath}`);
    return;
  }

  FILES_TO_COPY.forEach(file => {
    const sourcePath = getSourcePath(file);
    const destPath = path.join(pluginPath, file);

    if (!fs.existsSync(sourcePath)) {
      const error = `❌ Error: ${file} no existe en ${sourcePath}`;
      console.error(error);
      errors.push(error);
      return;
    }

    try {
      fs.copyFileSync(sourcePath, destPath);
      console.log(`✅ Desktop: ${pluginPath}/${file}`);
      copiedCount++;
    } catch (error) {
      const errorMsg = `❌ Error copiando ${file} a ${pluginPath}: ${error.message}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  });
};

const copyToEmulatorPath = (pluginPath) => {
  try {
    execFileSync('adb', ['shell', 'mkdir', '-p', pluginPath], { stdio: 'ignore' });
  } catch (error) {
    const errorMsg = `❌ Error preparando carpeta del emulador ${pluginPath}: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
    return;
  }

  FILES_TO_COPY.forEach(file => {
    const sourcePath = getSourcePath(file);

  if (!fs.existsSync(sourcePath)) {
    const error = `❌ Error: ${file} no existe en ${sourcePath}`;
    console.error(error);
    errors.push(error);
    return;
  }

  try {
      execFileSync('adb', ['push', sourcePath, `${pluginPath}/${file}`], { stdio: 'ignore' });
      console.log(`✅ Emulador: ${pluginPath}/${file}`);
    copiedCount++;
  } catch (error) {
      const errorMsg = `❌ Error copiando ${file} al emulador ${pluginPath}: ${error.message}`;
    console.error(errorMsg);
    errors.push(errorMsg);
  }
});
};

DESKTOP_PLUGIN_PATHS.forEach(copyToDesktopPath);
EMULATOR_PLUGIN_PATHS.forEach(copyToEmulatorPath);

// Mostrar resultado
console.log('\n' + '='.repeat(50));
const expectedCopies = FILES_TO_COPY.length * (DESKTOP_PLUGIN_PATHS.length + EMULATOR_PLUGIN_PATHS.length);

if (errors.length === 0 && copiedCount === expectedCopies) {
  console.log('✅ ¡Archivos copiados correctamente!');
  console.log(`📊 Archivos copiados: ${copiedCount}/${expectedCopies}`);
  
  console.log('\n💡 Recarga el plugin en Obsidian:');
  console.log('   Configuración → Plugins → Desactivar/Activar Notelert');
} else {
  console.error('❌ Hubo errores al copiar los archivos:');
  errors.forEach(error => console.error(`   ${error}`));
  process.exit(1);
}
