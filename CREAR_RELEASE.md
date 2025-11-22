# 📦 Cómo Crear/Actualizar el Release en GitHub

## Errores Detectados

1. ✅ **Corregido**: Añadido `isDesktopOnly: false` al manifest.json
2. ❌ **Pendiente**: El release `1.0.0` no tiene `main.js`
3. ❌ **Pendiente**: El release `1.0.0` no tiene `manifest.json`

## Pasos para Crear/Actualizar el Release

### Opción 1: Crear Release desde GitHub Web (Recomendado)

1. **Ve a tu repositorio**: https://github.com/Joaquim-Frances/obsidian-notelert-plugin

2. **Haz clic en "Releases"** (en el menú lateral derecho, o ve a: `https://github.com/Joaquim-Frances/obsidian-notelert-plugin/releases`)

3. **Si ya existe el release 1.0.0**:
   - Haz clic en "Edit release" o "Draft a new release"
   - Si existe, haz clic en el release 1.0.0 y luego en "Edit"

4. **Si no existe, crea uno nuevo**:
   - Haz clic en "Draft a new release" o "Create a new release"
   - **Tag version**: `1.0.0` (debe coincidir exactamente con la versión en manifest.json)
   - **Release title**: `1.0.0` (sin el prefijo "v")
   - **Description**: Puedes copiar el contenido de `RELEASE_NOTES_v1.0.0.md`

5. **Añade los archivos al release**:
   - En la sección "Attach binaries by dropping them here or selecting them"
   - Arrastra o selecciona estos archivos:
     - `dist/main.js` (el archivo compilado)
     - `manifest.json` (de la raíz del proyecto)
   - **IMPORTANTE**: Los archivos deben estar en la raíz del release, no en una carpeta

6. **Publica el release**:
   - Haz clic en "Publish release" o "Update release"

### Opción 2: Usar GitHub CLI (si lo tienes instalado)

```bash
# Asegúrate de estar en la raíz del proyecto
cd /Users/quimfrances/Programacio/obsidian-notelert-plugin

# Copia los archivos necesarios a un directorio temporal
mkdir -p release-files
cp dist/main.js release-files/
cp manifest.json release-files/

# Crea el release (requiere GitHub CLI instalado)
gh release create 1.0.0 \
  --title "1.0.0" \
  --notes-file RELEASE_NOTES_v1.0.0.md \
  release-files/main.js \
  release-files/manifest.json

# Limpia
rm -rf release-files
```

### Opción 3: Usar Git Tags y GitHub Web

1. **Asegúrate de que los archivos estén en el repositorio**:
   ```bash
   git add dist/main.js manifest.json
   git commit -m "Add release files"
   git push origin main
   ```

2. **Crea un tag**:
   ```bash
   git tag 1.0.0
   git push origin 1.0.0
   ```

3. **Ve a GitHub y crea el release desde el tag**:
   - Ve a "Releases" → "Draft a new release"
   - Selecciona el tag `1.0.0`
   - Añade los archivos manualmente como se describe en Opción 1

## ✅ Checklist Final

Antes de que el bot revalide, asegúrate de:

- [x] `manifest.json` tiene `isDesktopOnly: false`
- [ ] El release `1.0.0` existe en GitHub
- [ ] El release `1.0.0` tiene `main.js` como archivo adjunto
- [ ] El release `1.0.0` tiene `manifest.json` como archivo adjunto
- [ ] Los archivos están en la raíz del release (no en carpetas)
- [ ] El tag del release es exactamente `1.0.0` (sin "v")
- [ ] La versión en manifest.json es `1.0.0`

## 📝 Notas Importantes

- **El nombre del release debe ser exactamente `1.0.0`** (sin prefijo "v")
- **Los archivos deben estar como adjuntos del release**, no solo en el código fuente
- **main.js debe ser el archivo compilado** de `dist/main.js`
- **manifest.json debe ser el de la raíz** del proyecto

## 🔍 Verificación

Después de crear el release, verifica que:
1. Puedes descargar `main.js` desde el release
2. Puedes descargar `manifest.json` desde el release
3. El bot de validación de Obsidian puede acceder a estos archivos

