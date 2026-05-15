#!/usr/bin/env node

/**
 * Script para preparar los assets de GitHub Releases del plugin.
 * Obsidian solo descarga main.js, manifest.json y styles.css como assets individuales.
 */

const fs = require('fs');
const path = require('path');

// Leer la versión del manifest.json
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

console.log(`📦 Preparando assets de release para versión ${version}...\n`);

// Verificar que existe la carpeta dist
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Error: La carpeta dist/ no existe. Ejecuta "npm run build" primero.');
  process.exit(1);
}

// Verificar que existen los archivos compilados necesarios
const requiredBuildFiles = ['main.js', 'manifest.json'];
const missingFiles = [];

requiredBuildFiles.forEach(file => {
  const filePath = path.join(distPath, file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error(`❌ Error: Faltan los siguientes archivos en dist/: ${missingFiles.join(', ')}`);
  console.error('💡 Ejecuta "npm run build" para generar los archivos.');
  process.exit(1);
}

// Crear directorio de release
const releaseDir = path.join(__dirname, '..', 'releases');

// Limpiar directorio temporal si existe
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}

// Crear directorio de release
fs.mkdirSync(releaseDir, { recursive: true });

// Copiar archivos al directorio temporal
console.log('📋 Copiando archivos...');
requiredBuildFiles.forEach(file => {
  const sourcePath = path.join(distPath, file);
  const destPath = path.join(releaseDir, file);
  fs.copyFileSync(sourcePath, destPath);
  console.log(`   ✅ ${file}`);
});

// Copiar estilos si existen en la raíz del plugin
const stylesPath = path.join(__dirname, '..', 'styles.css');
if (fs.existsSync(stylesPath)) {
  fs.copyFileSync(stylesPath, path.join(releaseDir, 'styles.css'));
  console.log('   ✅ styles.css');
} else {
  console.log('   ⚠️ styles.css no encontrado, se omite');
}

console.log(`\n✅ Assets preparados en: ${releaseDir}`);
console.log(`\n💡 Sube estos archivos individuales a GitHub Releases:`);
console.log('   - main.js');
console.log('   - manifest.json');
console.log('   - styles.css');
console.log('\n⚠️  No subas archivos ZIP al release público de Obsidian; el review los marca como assets extra.');
