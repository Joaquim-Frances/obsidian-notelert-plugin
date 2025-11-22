# 🔧 Cómo Corregir el PR en GitHub

## Errores Detectados por el Bot

Según el bot de GitHub Actions, hay estos errores:

1. ❌ Typo en el campo repository
2. ❌ La entrada no está al final de la lista
3. ❌ La descripción necesita terminar con `.?!`
4. ❌ No encuentra manifest.json en la raíz (pero sí existe)
5. ❌ No encuentra LICENSE (pero sí existe)

## ✅ Correcciones Realizadas Localmente

- ✅ Descripción del manifest.json corregida (ahora termina con punto)

## 📝 Pasos para Corregir el PR en GitHub

### Opción 1: Editar directamente en GitHub (Más fácil)

1. **Ve al PR**: https://github.com/obsidianmd/obsidian-releases/pull/8640

2. **Encuentra el archivo a editar**:
   - En el PR, busca el archivo `community-plugins.json`
   - Haz clic en el archivo para ver su contenido

3. **Haz clic en el icono de lápiz (✏️)** en la parte superior derecha del archivo
   - Esto te permitirá editar el archivo directamente en GitHub

4. **Corrige la entrada de tu plugin**:
   - Asegúrate de que la entrada esté al **final** de la lista
   - Verifica que el formato sea correcto:
   ```json
   {
     "id": "notelert",
     "name": "Notelert",
     "author": "Joaquim-Frances",
     "description": "Automates the creation of notifications for the Notelert mobile app by creating deeplinks of date and time or location.",
     "repo": "Joaquim-Frances/obsidian-notelert-plugin"
   }
   ```

5. **Verifica estos puntos**:
   - ✅ El `id` debe ser `"notelert"` (sin mayúsculas)
   - ✅ El `repo` debe ser exactamente `"Joaquim-Frances/obsidian-notelert-plugin"` (sin https://github.com/)
   - ✅ La descripción debe terminar con punto `.`
   - ✅ La entrada debe estar al final de la lista JSON

6. **Guarda los cambios**:
   - Haz scroll hacia abajo
   - Escribe un mensaje de commit (ej: "Fix: Correct plugin entry format")
   - Haz clic en "Commit changes"

### Opción 2: Editar localmente y hacer push

Si prefieres editar localmente:

1. **Haz commit de los cambios locales**:
   ```bash
   git add manifest.json
   git commit -m "Fix: Add period to description in manifest.json"
   git push origin main
   ```

2. **Edita el archivo community-plugins.json en el fork**:
   - Necesitas hacer fork del repositorio `obsidianmd/obsidian-releases`
   - O si ya tienes el fork, clónalo y edita el archivo

## 🔍 Verificación de Errores Específicos

### Error 1: "Typo in repository field"
- **Solución**: Verifica que el campo `repo` sea exactamente: `"Joaquim-Frances/obsidian-notelert-plugin"`
- No debe tener `https://github.com/` al inicio
- No debe tener `.git` al final

### Error 2: "Entry not at the end"
- **Solución**: Asegúrate de que tu entrada esté al final del array JSON
- Debe ser la última entrada antes del cierre del array

### Error 3: "Description needs punctuation"
- **Solución**: ✅ Ya corregido - la descripción ahora termina con punto

### Error 4 y 5: "manifest.json or LICENSE not found"
- **Posible causa**: GitHub puede tardar unos minutos en detectar los archivos
- **Solución**: 
  - Verifica que `manifest.json` esté en la raíz del repo
  - Verifica que `LICENSE` esté en la raíz del repo
  - Haz un commit vacío para forzar la revalidación:
    ```bash
    git commit --allow-empty -m "Trigger revalidation"
    git push origin main
    ```

## 📋 Checklist Final

Antes de que el bot revalide, asegúrate de:

- [x] manifest.json tiene descripción que termina con punto
- [ ] La entrada en community-plugins.json está al final
- [ ] El campo `repo` es exactamente `"Joaquim-Frances/obsidian-notelert-plugin"`
- [ ] El campo `id` es `"notelert"` (minúsculas)
- [ ] La descripción en community-plugins.json termina con punto
- [ ] manifest.json está en la raíz del repositorio
- [ ] LICENSE está en la raíz del repositorio

## 🚀 Después de Corregir

1. Espera unos minutos para que el bot revalide
2. Si los errores persisten, verifica que los archivos estén en la rama correcta
3. Asegúrate de que el repositorio sea público

