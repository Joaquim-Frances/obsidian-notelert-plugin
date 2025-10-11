# 🚀 Guía de Instalación - Plugin Notelert

Esta guía te ayudará a instalar y configurar el plugin Notelert en tu Obsidian.

## 📋 Requisitos Previos

- **Obsidian** versión 0.15.0 o superior
- **App Notelert** instalada en tu dispositivo móvil
- **Node.js** (solo para desarrollo) versión 14.0.0 o superior

## 🔧 Instalación para Usuarios

### Método 1: Instalación Manual (Recomendado)

1. **Descarga los archivos del plugin**
   - Descarga `main.js` y `manifest.json` desde la carpeta `lib/`
   - O clona el repositorio completo

2. **Crea la carpeta del plugin**
   ```
   .obsidian/plugins/obsidian-notelert-plugin/
   ```

3. **Copia los archivos**
   - Copia `main.js` y `manifest.json` a la carpeta creada
   - La estructura debe quedar así:
   ```
   .obsidian/plugins/obsidian-notelert-plugin/
   ├── main.js
   └── manifest.json
   ```

4. **Activa el plugin**
   - Abre Obsidian
   - Ve a Configuración → Plugins de la comunidad
   - Busca "Notelert" y actívalo

5. **Configura el plugin**
   - Ve a Configuración → Plugins de la comunidad → Notelert
   - Ajusta las opciones según tus necesidades

## 🛠️ Instalación para Desarrolladores

### 1. Clonar el Repositorio
```bash
git clone https://github.com/tu-usuario/obsidian-notelert-plugin.git
cd obsidian-notelert-plugin
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Compilar el Plugin
```bash
npm run build
```

### 4. Copiar a Obsidian
```bash
# En Windows
copy lib\* "%APPDATA%\Obsidian\Plugins\obsidian-notelert-plugin\"

# En macOS
cp lib/* ~/Library/Application\ Support/obsidian/Plugins/obsidian-notelert-plugin/

# En Linux
cp lib/* ~/.config/obsidian/Plugins/obsidian-notelert-plugin/
```

### 5. Modo Desarrollo
Para desarrollo activo con recarga automática:
```bash
npm run dev
```

## ⚙️ Configuración Inicial

### 1. Configuración Básica
- **Procesamiento automático**: ✅ Activado
- **Procesar al guardar**: ✅ Activado
- **Procesar al abrir**: ❌ Desactivado (opcional)
- **Modo debug**: ❌ Desactivado (solo para desarrollo)

### 2. Configuración Avanzada
- **Carpetas excluidas**: `Templates, Archive, Trash`
- **Palabras clave personalizadas**: Añade las tuyas si es necesario

### 3. Verificar Funcionamiento
1. Crea una nueva nota
2. Escribe: `Recordar: Prueba a las 15:30`
3. Guarda la nota (Ctrl+S)
4. Verifica que se abra la app Notelert

## 🔍 Solución de Problemas

### El plugin no aparece en la lista
- Verifica que los archivos estén en la carpeta correcta
- Comprueba que `manifest.json` tenga el formato correcto
- Reinicia Obsidian

### No se detectan patrones
- Verifica que uses las palabras clave correctas
- Comprueba el formato de fecha/hora
- Activa el modo debug para ver mensajes

### La app Notelert no se abre
- Verifica que la app esté instalada
- Comprueba que el deeplink sea correcto
- Prueba abrir manualmente: `notelert://add?title=Test&message=Test&date=2025-01-01&time=12:00`

### Errores de compilación
- Verifica que Node.js esté instalado
- Ejecuta `npm install` para instalar dependencias
- Comprueba que TypeScript esté funcionando

## 📱 Configuración de la App Notelert

### 1. Instalar la App
- Descarga Notelert desde tu tienda de aplicaciones
- Instala y abre la app por primera vez

### 2. Configurar Permisos
- Permite que la app reciba deeplinks
- Configura las notificaciones según tus preferencias

### 3. Probar la Conexión
- Usa el comando "Procesar nota actual" en Obsidian
- Verifica que la app se abra y procese el deeplink

## 🎯 Primeros Pasos

### 1. Crear una Nota de Prueba
```
# Notas de Prueba

Recordar: Reunión importante mañana a las 10:00
Notificar: Llamar al doctor el 15/12 a las 14:30
Alerta: Comprar regalos hoy a las 18:00
```

### 2. Procesar Manualmente
- Usa `Ctrl+P` → "Procesar nota actual para Notelert"
- Verifica que se creen las notificaciones

### 3. Configurar Automatización
- Activa "Procesar al guardar" en la configuración
- Escribe patrones en tus notas y guarda
- Verifica que se procesen automáticamente

## 📚 Recursos Adicionales

- **README.md**: Documentación completa del plugin
- **ejemplos.md**: Ejemplos de patrones soportados
- **GitHub Issues**: Reporta bugs o solicita features
- **Comunidad Obsidian**: Busca ayuda en el foro

## 🆘 Soporte

Si tienes problemas:

1. **Revisa esta guía** paso a paso
2. **Consulta el README.md** para más detalles
3. **Abre un issue** en GitHub con:
   - Descripción del problema
   - Pasos para reproducirlo
   - Información del sistema (OS, versión de Obsidian)
   - Logs de error (si los hay)

---

**¡Disfruta usando Notelert!** 🎉
