# Notelert

Automatiza la creación de notificaciones para la app móvil **Notelert** detectando patrones de fecha/hora en tus notas de Obsidian. Escribe recordatorios en tus notas y el plugin los convertirá automáticamente en notificaciones programadas.

## Características

- ✅ **Detección automática** de patrones de fecha/hora usando sintaxis `{@fecha, hora}`
- ✅ **Selector de fecha interactivo** - Escribe `{@` para abrir un selector visual de fecha y hora
- ✅ **Selector de ubicación** - Escribe `{#` para crear recordatorios basados en ubicación (geofencing)
- ✅ **Soporte multiidioma** - 10 idiomas populares con palabras clave nativas
- ✅ **Fechas relativas** - Soporta "hoy", "mañana", "ayer" en múltiples idiomas
- ✅ **Fechas absolutas** - Formatos DD/MM, DD/MM/YYYY, DD-MM-YYYY
- ✅ **Múltiples formatos de hora** - HH:MM, H:MM, HH.MM, H.MM
- ✅ **Notificaciones por email** - En desktop, programa emails directamente sin necesidad de app móvil
- ✅ **Integración con Notelert** - En móvil, abre la app Notelert automáticamente
- ✅ **Geocodificación** - Soporte para múltiples proveedores (Google Maps, Nominatim, Mapbox, etc.)
- ✅ **Configuración flexible** - Personaliza palabras clave, carpetas excluidas y más

## Instalación

### Desde Obsidian (Recomendado)

1. Abre **Configuración** → **Plugins de la comunidad**
2. Busca "Notelert"
3. Haz clic en **Instalar** y luego **Activar**

### Instalación Manual

1. Descarga la última versión desde [GitHub Releases](https://github.com/tu-usuario/obsidian-notelert-plugin/releases)
2. Extrae los archivos `main.js` y `manifest.json` a tu carpeta de plugins:
   ```
   .obsidian/plugins/obsidian-notelert-plugin/
   ```
3. Reinicia Obsidian y activa el plugin en **Configuración** → **Plugins de la comunidad**

## Uso

### Sintaxis Básica

El plugin detecta patrones usando la sintaxis `{@fecha, hora}`:

```
{@mañana, 10:00} Reunión importante con el equipo
{@15/12/2025, 14:30} Cita médica con el doctor
{@hoy, 18:00} Comprar regalos de Navidad
```

### Selector de Fecha Interactivo

1. Escribe `{@` en cualquier nota
2. Se abrirá automáticamente un selector de fecha y hora
3. Selecciona la fecha y hora deseadas
4. El plugin creará automáticamente la notificación

### Selector de Ubicación

1. Escribe `{#` en cualquier nota
2. Se abrirá un selector de ubicación con mapa interactivo
3. Busca una dirección o haz clic en el mapa
4. Configura el radio de la geofence
5. El plugin creará un recordatorio basado en ubicación

### Ejemplos

#### Fechas Relativas
```
{@hoy, 16:00} Revisar emails pendientes
{@mañana, 09:00} Llamar al cliente
{@ayer, 20:00} Revisar notas de la reunión
```

#### Fechas Absolutas
```
{@12/10, 18:00} Comprar regalos de cumpleaños
{@15/10/2025, 14:30} Cita médica importante
{@31-12-2025, 23:59} Celebración de Año Nuevo
```

#### Con Ubicación
```
{#Casa, 100m} Llegar a casa y tomar medicamento
{#Trabajo, 50m} Reunión de equipo en la oficina
{#Supermercado, 200m} Comprar ingredientes para la cena
```

## Configuración

Accede a la configuración desde **Configuración** → **Plugins de la comunidad** → **Notelert**

### Configuración General

- **Activar selector de fecha** - Activa/desactiva el selector al escribir `{@`
- **Modo debug** - Muestra mensajes de debug en la consola
- **Idioma** - Selecciona el idioma para detección de patrones (10 idiomas disponibles)

### Configuración Desktop (Email)

- **Email del usuario** - Tu email para recibir notificaciones programadas
- **API Key de Notelert** - Clave de API para autenticación (incluida por defecto)

### Configuración de Ubicación

- **Proveedor de geocodificación** - Elige entre Google Maps, Nominatim, Mapbox, etc.
- **API Keys** - Configura API keys opcionales para proveedores premium
- **Ubicaciones guardadas** - Administra tus ubicaciones favoritas

### Carpetas Excluidas

Por defecto, estas carpetas no se procesan:
- `Templates`
- `Archive`
- `Trash`

Puedes añadir más carpetas en la configuración.

## Idiomas Soportados

El plugin soporta detección de patrones en 10 idiomas:

- 🇪🇸 **Español** - `Recordar:`, `Notificar:`, `Alerta:`, etc.
- 🇺🇸 **English** - `Remember:`, `Notify:`, `Alert:`, etc.
- 🇫🇷 **Français** - `Rappeler:`, `Notifier:`, `Alerte:`, etc.
- 🇩🇪 **Deutsch** - `Erinnern:`, `Benachrichtigen:`, `Alarm:`, etc.
- 🇮🇹 **Italiano** - `Ricordare:`, `Notificare:`, `Allerta:`, etc.
- 🇵🇹 **Português** - `Lembrar:`, `Notificar:`, `Alerta:`, etc.
- 🇷🇺 **Русский** - `Напомнить:`, `Уведомить:`, `Тревога:`, etc.
- 🇯🇵 **日本語** - `覚えて:`, `通知:`, `アラート:`, etc.
- 🇨🇳 **中文** - `记住:`, `通知:`, `警报:`, etc.
- 🇸🇦 **العربية** - `تذكر:`, `إشعار:`, `تنبيه:`, etc.

Cada idioma tiene sus propias palabras clave nativas y soporte para fechas relativas.

## Requisitos

- **Obsidian**: Versión 0.15.0 o superior
- **Sistemas operativos**: Windows, macOS, Linux
- **Notelert** (opcional): App móvil instalada para notificaciones push en dispositivos móviles

## Plataformas

### Desktop (Windows, macOS, Linux)

En desktop, el plugin programa notificaciones por **email** directamente usando la API de Notelert. No necesitas la app móvil instalada.

### Móvil (Android/iOS)

En dispositivos móviles, el plugin abre la app **Notelert** automáticamente usando deeplinks para crear notificaciones push.

## Solución de Problemas

### El selector de fecha no se abre

- Verifica que "Activar selector de fecha" esté habilitado en la configuración
- Asegúrate de escribir exactamente `{@` (sin espacios)
- Reinicia Obsidian si el problema persiste

### No se crean las notificaciones

- **En desktop**: Verifica que tu email esté configurado correctamente
- **En móvil**: Asegúrate de que la app Notelert esté instalada
- Activa el modo debug para ver mensajes detallados en la consola

### Errores de geocodificación

- Verifica que tu API key esté configurada correctamente (si usas un proveedor premium)
- Considera cambiar a Nominatim (gratuito, sin API key requerida)
- Revisa los logs en la consola con el modo debug activado

## Desarrollo

### Construir desde el código fuente

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/obsidian-notelert-plugin.git
cd obsidian-notelert-plugin

# Instalar dependencias
npm install

# Compilar el plugin
npm run build
```

### Estructura del Proyecto

```
obsidian-notelert-plugin/
├── src/
│   ├── main.ts              # Punto de entrada del plugin
│   ├── core/                # Configuración y tipos
│   ├── features/            # Funcionalidades principales
│   ├── modals/              # Modales de interfaz
│   └── settings/            # Panel de configuración
├── manifest.json            # Manifest del plugin
└── package.json             # Dependencias y scripts
```

## Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Autor

**Quim Frances**

- GitHub: [@tu-usuario](https://github.com/tu-usuario)

## Agradecimientos

- Equipo de Obsidian por la excelente API
- Comunidad de desarrolladores de plugins
- Todos los usuarios que reportan bugs y sugieren mejoras

---

**¿Tienes problemas o sugerencias?** Abre un [issue en GitHub](https://github.com/tu-usuario/obsidian-notelert-plugin/issues).

**¿Te gusta el plugin?** ¡Dale una estrella ⭐ en GitHub!
