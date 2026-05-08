#!/usr/bin/env node

/**
 * Script para crear un archivo ZIP con los archivos necesarios para instalar el plugin
 * Este ZIP puede subirse directamente a GitHub Releases
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Leer la versión del manifest.json
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

console.log(`📦 Creando release ZIP para versión ${version}...\n`);

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

// Crear directorio temporal para el release
const releaseDir = path.join(__dirname, '..', 'release');
const zipName = `notelert-${version}.zip`;
const zipPath = path.join(__dirname, '..', zipName);

// Limpiar directorio temporal si existe
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true, force: true });
}

// Crear directorio temporal
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

// Crear ZIP
console.log(`\n🗜️  Creando archivo ZIP: ${zipName}...`);
try {
  // Usar zip si está disponible (macOS/Linux)
  const zipCommand = `cd "${releaseDir}" && zip -r "${zipPath}" .`;
  execSync(zipCommand, { stdio: 'inherit' });
  console.log(`\n✅ ¡ZIP creado exitosamente!`);
  console.log(`📁 Ubicación: ${zipPath}`);
  console.log(`\n💡 Puedes subir este archivo a GitHub Releases:`);
  console.log(`   1. Ve a https://github.com/quimfrances/obsidian-notelert-plugin/releases`);
  console.log(`   2. Crea un nuevo release con el tag: ${version}`);
  console.log(`   3. Arrastra ${zipName} al release`);
} catch (error) {
  console.error('\n❌ Error al crear el ZIP. Asegúrate de tener "zip" instalado.');
  console.error('   Alternativa: Comprime manualmente la carpeta "release"');
  console.error(`   Error: ${error.message}`);
  process.exit(1);
}

// Limpiar directorio temporal
fs.rmSync(releaseDir, { recursive: true, force: true });

console.log(`\n✨ ¡Listo! El archivo ${zipName} está listo para subir a GitHub Releases.`);
