# 📥 Guía de Instalación - Notelert Plugin

## Método 1: Descargar ZIP desde GitHub Actions (Recomendado)

### Paso 1: Descargar el ZIP

1. Ve a la página de [Actions](https://github.com/quimfrances/obsidian-notelert-plugin/actions)
2. Busca el último workflow ejecutado con éxito (marca verde ✓)
3. Haz clic en el workflow
4. Desplázate hacia abajo hasta la sección **"Artifacts"**
5. Descarga `notelert-plugin.zip`

### Paso 2: Extraer el ZIP

1. Extrae el archivo ZIP
2. Deberías tener dos archivos:
   - `main.js`
   - `manifest.json`

### Paso 3: Instalar en Obsidian

1. Abre Obsidian
2. Ve a **Settings** (⚙️) → **Community plugins**
3. Si está activado, desactiva **"Safe mode"**
4. Haz clic en **"Open plugins folder"** (o navega manualmente a `.obsidian/plugins/` en tu vault)
5. Crea una nueva carpeta llamada `notelert`
6. Copia los archivos `main.js` y `manifest.json` dentro de la carpeta `notelert`
7. Vuelve a Obsidian Settings → Community Plugins
8. Activa el plugin **"Notelert"**

## Método 2: Descargar archivos directamente del repositorio

### Paso 1: Descargar los archivos

1. Ve a la carpeta [dist](https://github.com/quimfrances/obsidian-notelert-plugin/tree/main/dist) en el repositorio
2. Para `main.js`:
   - Haz clic en `main.js`
   - Haz clic en el botón **"Raw"** (arriba a la derecha)
   - Haz clic derecho → **"Save As"** → Guarda como `main.js`
3. Para `manifest.json`:
   - Haz clic en `manifest.json`
   - Haz clic en el botón **"Raw"** (arriba a la derecha)
   - Haz clic derecho → **"Save As"** → Guarda como `manifest.json`

### Paso 2: Instalar en Obsidian

Sigue los mismos pasos del **Paso 3** de la sección anterior.

## Verificación

Después de instalar, verifica que:

1. ✅ El plugin aparece en Settings → Community Plugins
2. ✅ Puedes activar/desactivar el plugin
3. ✅ Aparece "Notelert: Activo" en la barra de estado (parte inferior de Obsidian)

## Solución de Problemas

### El plugin no aparece

- Verifica que los archivos estén en `.obsidian/plugins/notelert/`
- Asegúrate de que ambos archivos (`main.js` y `manifest.json`) estén presentes
- Reinicia Obsidian

### Error al cargar el plugin

- Verifica que tu versión de Obsidian sea 0.15.0 o superior
- Revisa la consola de Obsidian (Help → Toggle Developer Console) para ver errores
- Asegúrate de haber descargado la versión correcta del release

### El plugin no funciona en móvil

- Notelert actualmente solo está disponible para Android
- iOS no está soportado aún (la app está en desarrollo)
- Asegúrate de tener la app Notelert instalada en tu dispositivo Android

## Actualizar el Plugin

Para actualizar a una nueva versión:

1. Descarga la nueva versión desde [Actions](https://github.com/quimfrances/obsidian-notelert-plugin/actions) (método 1) o desde la carpeta [dist](https://github.com/quimfrances/obsidian-notelert-plugin/tree/main/dist) (método 2)
2. Reemplaza los archivos `main.js` y `manifest.json` en `.obsidian/plugins/notelert/`
3. Recarga el plugin en Obsidian (desactivar y activar)

## Requisitos

- **Obsidian**: Versión 0.15.0 o superior
- **App móvil**: Notelert instalada en Android (para funciones móviles)
- **Premium**: Suscripción Premium requerida para notificaciones de ubicación y email

