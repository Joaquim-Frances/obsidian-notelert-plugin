# 📝 Changelog - Plugin Notelert

Todas las notables cambios a este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## 🔮 Roadmap Futuro

### Versión 1.1.0 (Próxima)
- [ ] **Soporte para fechas en inglés**: today, tomorrow, yesterday
- [ ] **Soporte para horas en formato 12h**: 3:30 PM, 9:00 AM
- [ ] **Patrones más flexibles**: detección de contexto
- [ ] **Integración con calendario**: sincronización con Google Calendar
- [ ] **Notificaciones de confirmación**: feedback visual en Obsidian

### Versión 1.2.0 (Futuro)
- [ ] **Soporte para múltiples apps**: integración con otras apps de notificaciones
- [ ] **Plantillas personalizadas**: crear plantillas de recordatorios
- [ ] **Análisis de patrones**: estadísticas de uso
- [ ] **Exportación/importación**: backup de configuraciones
- [ ] **API pública**: para desarrolladores externos

### Versión 2.0.0 (Lejano)
- [ ] **Interfaz gráfica**: panel lateral en Obsidian
- [ ] **Sincronización en la nube**: configuración compartida
- [ ] **Machine Learning**: detección inteligente de patrones
- [ ] **Integración con IA**: generación automática de recordatorios
- [ ] **Soporte para múltiples idiomas**: internacionalización

---

## 🤝 Contribuciones

### Cómo Contribuir
1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Tipos de Contribuciones
- **🐛 Bug fixes**: Corrección de errores
- **✨ Features**: Nuevas funcionalidades
- **📚 Documentation**: Mejoras en documentación
- **🧪 Tests**: Añadir o mejorar tests
- **🎨 UI/UX**: Mejoras en interfaz de usuario
- **⚡ Performance**: Optimizaciones de rendimiento

### Reportar Bugs
- Usa el template de issue de GitHub
- Incluye información del sistema
- Proporciona pasos para reproducir
- Añade logs de error si es posible

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Quim Frances**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu-email@ejemplo.com

---

**¿Tienes sugerencias para futuras versiones?** Abre un issue en GitHub o contacta al autor.
