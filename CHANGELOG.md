# 📝 Changelog - Plugin Notelert

Todas las notables cambios a este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.5] - 2026-08-19

### Corregido
- El modal conserva el mismo tamaño en escritorio al cambiar entre Recordatorio, Notelert Pro y Calendario.
- El selector de fecha reserva espacio para el icono nativo, evitando que se solape con la fecha.

## [1.2.4] - 2026-08-19

### Corregido
- El selector de fecha ya no deja promesas sin gestionar al iniciar el seguimiento de Stripe.
- Eliminada una variable no utilizada en la vista de calendario.
- El bundle y los assets de release se generan desde el mismo commit inmutable del tag.

## [1.2.3] - 2026-08-19

### Añadido
- Vista de calendario para los recordatorios programados, con navegación mensual.
- Notelert Pro permite usar canales ilimitados por recordatorio; Free mantiene un canal seleccionable.

### Corregido
- Los enlaces de Obsidian enviados por Telegram abren mediante un enlace web seguro y presionable.
- La vista de calendario detecta el estado Pro al abrirse y se actualiza tras crear un recordatorio.

## [1.2.2] - 2026-08-11

### Mejorado
- La programación de un recordatorio por Android, email, Google Calendar y
  Telegram se inicia en paralelo. Con varios canales activos, el tiempo de
  espera pasa a depender del canal más lento en lugar de sumar las cuatro
  peticiones.

### Corregido
- El disparador configurable del selector de fecha se conserva al crear el
  recordatorio y se limpia correctamente del mensaje antes de enviarlo.

## [1.2.1] - 2026-08-01

### Añadido
- Selector de canales en el modal de cada recordatorio para elegir in situ entre
  los canales habilitados en los ajustes.
- Panel desplegable de Android con acceso directo a Notelert en Google Play.

### Modificado
- La cuota y su barra de progreso representan notificaciones compartidas entre
  todos los canales, en lugar de mostrarse como un límite exclusivo de email.
- Simplificado el ajuste de idioma eliminando el subtítulo sobre detección de
  patrones.

### Corregido
- Eliminado el selector CSS `:has()` señalado por la revisión de Obsidian para
  evitar una invalidación de selectores demasiado amplia.

## [1.2.0] - 2026-07-30

### Añadido
- Entrega independiente mediante Android, email, Google Calendar y Telegram.
- Conexión persistente de Google Calendar mediante OAuth desde el plugin.
- Conexión segura con el bot oficial de Telegram mediante código de un solo uso.
- Cuota Free compartida de 10 recordatorios mensuales: un recordatorio cuenta
  una vez aunque utilice varios canales.

### Modificado
- Email y Telegram se configuran dentro de paneles plegables junto a sus
  interruptores.
- Los avisos de resultado enumeran todos los canales programados y fallidos.
- Android deja de ser obligatorio para recordatorios de fecha y hora.
- Actualizadas las declaraciones de privacidad, servicios externos y planes.

### Seguridad
- Credenciales OAuth, secretos de Telegram y `chat_id` permanecen cifrados o
  exclusivamente en el backend.
- Estados OAuth y códigos de Telegram son aleatorios, de un solo uso y se
  eliminan automáticamente tras caducar.
- Calendar y Telegram se desconectan si el proveedor revoca el acceso.

## [1.1.9] - 2026-05-29

### Añadido
- Añadidos botones oficiales de descarga (badges) de Google Play e iOS App Store en el archivo README.md, redirigiendo este último a la sección de lista de espera (waitlist) de iPhone de la web oficial.

### Modificado
- Sincronizado el código con los últimos cambios y mejoras visuales del monorepo, incluyendo la validación de fechas pasadas, traducciones robustas en i18n y ajustes de alineación visual.

## [1.1.6] - 2026-05-16

### Corregido
- Publicada una nueva versión para disparar de nuevo la pipeline de review con los manifests ya alineados.
- Mantenida la compatibilidad de instalación con `minAppVersion` en `1.0.0`.
- Confirmada la descripción del manifest sin la palabra "Obsidian".

## [1.1.5] - 2026-05-16

### Corregido
- Renombrada la configuración de token como App link token y actualizado el enlace correcto de Google Play.
- Corregido el selector de idioma de la pantalla de ajustes.
- Eliminada la tarjeta visible de modo debug de la configuración del plugin.
- Ajustado el banner de app requerida para evitar solapamientos con el botón de cierre.
- Eliminado el uso de APIs DOM problemáticas detectadas por la review de Obsidian.
- Reescrito el README para reflejar el flujo actual por Firebase, privacidad, premium y fase de pruebas.

## [1.1.4] - 2026-05-15

### Corregido
- Añadido workflow de release con assets individuales para Obsidian y attestations de GitHub.
- Eliminado el ZIP del flujo de publicación para evitar assets extra en la review de Obsidian.
- Pulido el uso de APIs y tipos en helpers DOM, modales, settings y handlers de notificaciones.
- Actualizados los enlaces del repositorio y la preparación de assets de release.

## [1.1.3] - 2026-05-08

### Corregido
- Migración de la pestaña de ajustes a `getSettingDefinitions()` para alinearse con la API vigente de Obsidian.
- Ajuste del refresco de la interfaz de settings al cambiar idioma o token.
- Cierre persistente del banner de app requerida hasta que se configure el token.

## [1.0.0] - 2025-01-11

### ✨ Añadido
- **Detección automática** de patrones de fecha/hora en notas
- **Generación automática** de deeplinks para la app Notelert
- **Soporte multiidioma** completo (10 idiomas populares)
- **Soporte para fechas relativas**: hoy, mañana, ayer (en múltiples idiomas)
- **Soporte para fechas absolutas**: DD/MM, DD/MM/YYYY, DD-MM-YYYY
- **Soporte para horas**: HH:MM, H:MM, HH.MM, H.MM
- **Procesamiento automático** al guardar notas
- **Procesamiento manual** con comandos
- **Configuración personalizable** del plugin
- **Selector de idiomas** en la configuración
- **Palabras clave nativas** para cada idioma soportado
- **Palabras clave personalizadas** para activar el procesamiento
- **Carpetas excluidas** para evitar procesamiento
- **Modo debug** para desarrollo
- **Comandos disponibles**:
  - Procesar nota actual
  - Procesar todas las notas
  - Limpiar historial de procesamiento
- **Interfaz de configuración** completa y traducida
- **Documentación completa** con ejemplos multiidioma
- **Sistema de logging** para debugging
- **Sistema de internacionalización (i18n)** robusto

### 🔧 Características Técnicas
- **Detección de patrones** con expresiones regulares
- **Parsing inteligente** de fechas y horas
- **Generación de deeplinks** con formato Notelert
- **Ejecución automática** de deeplinks
- **Gestión de estado** del plugin
- **Configuración persistente** en Obsidian
- **Manejo de errores** robusto
- **Soporte para TypeScript** completo

### 📱 Compatibilidad
- **Obsidian**: Versión 0.15.0 o superior
- **Sistemas operativos**: Windows, macOS, Linux
- **App Notelert**: Cualquier versión compatible con deeplinks

### 🎯 Patrones Soportados
- **Idiomas soportados**: Español, English, Français, Deutsch, Italiano, Português, Русский, 日本語, 中文, العربية
- **Palabras clave nativas** para cada idioma
- **Fechas relativas** en múltiples idiomas: hoy/today/aujourd'hui/heute/oggi/hoje/сегодня/今日/今天/اليوم
- **Fechas absolutas**: 12/10, 15/10/2025, 12-10-2025
- **Horas**: 15:30, 9:00, 18.45, 9.00

### 📚 Documentación
- **README.md**: Documentación completa del plugin
- **INSTALACION.md**: Guía paso a paso de instalación
- **ejemplos.md**: Ejemplos de uso y patrones
- **ejemplos-multiidioma.md**: Ejemplos en todos los idiomas soportados
- **CHANGELOG.md**: Historial de cambios

## [0.0.1] - 2025-01-11

### ✨ Añadido
- Estructura inicial del proyecto
- Configuración básica de TypeScript
- Plugin de ejemplo de Obsidian
- Configuración de build y desarrollo

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Quim Frances**
- GitHub: [@Joaquim-Frances](https://github.com/Joaquim-Frances)

---

**¿Tienes sugerencias para futuras versiones?** Abre un issue en GitHub o contacta al autor.
