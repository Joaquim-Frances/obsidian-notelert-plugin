# 🔔 Notelert Plugin para Obsidian

Un plugin que automatiza la creación de notificaciones para la app móvil **Notelert** detectando patrones de fecha/hora en tus notas de Obsidian.

## 📱 ¿Qué es Notelert?

Notelert es una app móvil que recibe deeplinks con formato:
```
notelert://add?title=TÍTULO&message=MENSAJE&date=YYYY-MM-DD&time=HH:MM
```

## 🎯 Características

- ✅ **Detección automática** de patrones de fecha/hora
- ✅ **Generación automática** de deeplinks para Notelert
- ✅ **Procesamiento en tiempo real** al guardar notas
- ✅ **Soporte multiidioma** (10 idiomas populares)
- ✅ **Soporte para fechas relativas** (hoy, mañana, ayer)
- ✅ **Soporte para fechas absolutas** (12/10, 15/10/2025)
- ✅ **Soporte para horas** (15:30, 9:00, 18.45)
- ✅ **Configuración personalizable**
- ✅ **Comandos manuales** para procesar notas
- ✅ **Modo debug** para desarrollo
- ✅ **Interfaz traducida** en múltiples idiomas

## 🚀 Instalación

### Método 1: Instalación Manual

1. Descarga el archivo `main.js` y `manifest.json` del plugin
2. Copia los archivos a tu carpeta de plugins de Obsidian:
   ```
   .obsidian/plugins/obsidian-notelert-plugin/
   ```
3. Activa el plugin en Configuración → Plugins de la comunidad

### Método 2: Desarrollo

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/obsidian-notelert-plugin.git
   cd obsidian-notelert-plugin
   ```

2. Instala dependencias:
   ```bash
   npm install
   ```

3. Compila el plugin:
   ```bash
   npm run build
   ```

4. Copia los archivos generados a tu carpeta de plugins

## 📝 Patrones Soportados

### 🌍 Idiomas Soportados
El plugin soporta **10 idiomas populares**:

- 🇪🇸 **Español**: `Recordar:`, `Notificar:`, `Alerta:`, `Recordatorio:`, `Aviso:`
- 🇺🇸 **English**: `Remember:`, `Notify:`, `Alert:`, `Reminder:`, `Notice:`
- 🇫🇷 **Français**: `Rappeler:`, `Notifier:`, `Alerte:`, `Rappel:`, `Avis:`
- 🇩🇪 **Deutsch**: `Erinnern:`, `Benachrichtigen:`, `Alarm:`, `Erinnerung:`, `Hinweis:`
- 🇮🇹 **Italiano**: `Ricordare:`, `Notificare:`, `Allerta:`, `Promemoria:`, `Avviso:`
- 🇵🇹 **Português**: `Lembrar:`, `Notificar:`, `Alerta:`, `Lembrete:`, `Aviso:`
- 🇷🇺 **Русский**: `Напомнить:`, `Уведомить:`, `Тревога:`, `Напоминание:`, `Уведомление:`
- 🇯🇵 **日本語**: `覚えて:`, `通知:`, `アラート:`, `リマインダー:`, `お知らせ:`
- 🇨🇳 **中文**: `记住:`, `通知:`, `警报:`, `提醒:`, `注意:`
- 🇸🇦 **العربية**: `تذكر:`, `إشعار:`, `تنبيه:`, `تذكير:`, `تنبيه:`

### Palabras Clave por Idioma
Cada idioma tiene sus propias palabras clave nativas que el plugin detecta automáticamente.

### Fechas

#### Fechas Relativas (por idioma)
- 🇪🇸 **Español**: `hoy`, `mañana`, `ayer`
- 🇺🇸 **English**: `today`, `tomorrow`, `yesterday`
- 🇫🇷 **Français**: `aujourd'hui`, `demain`, `hier`
- 🇩🇪 **Deutsch**: `heute`, `morgen`, `gestern`
- 🇮🇹 **Italiano**: `oggi`, `domani`, `ieri`
- 🇵🇹 **Português**: `hoje`, `amanhã`, `ontem`
- 🇷🇺 **Русский**: `сегодня`, `завтра`, `вчера`
- 🇯🇵 **日本語**: `今日`, `明日`, `昨日`
- 🇨🇳 **中文**: `今天`, `明天`, `昨天`
- 🇸🇦 **العربية**: `اليوم`, `غداً`, `أمس`

#### Fechas Absolutas
- `12/10` - 12 de octubre (año actual)
- `15/10/2025` - 15 de octubre de 2025
- `12-10-2025` - 12 de octubre de 2025 (con guiones)

### Horas

#### Formato 24 Horas
- `15:30` - 3:30 PM
- `9:00` - 9:00 AM
- `18:45` - 6:45 PM

#### Formato con Punto
- `15.30` - 3:30 PM
- `9.00` - 9:00 AM

## 💡 Ejemplos de Uso

### 🇪🇸 Ejemplos en Español
```
Recordar: Reunión importante a las 15:30
Notificar: Llamar al doctor mañana a las 09:00
Alerta: Comprar regalos el 12/10 a las 18:00
Recordatorio: Cita médica el 15/10/2025 a las 14:30
Aviso: Revisar emails hoy a las 16:00
```

### 🇺🇸 Examples in English
```
Remember: Important meeting at 15:30
Notify: Call doctor tomorrow at 09:00
Alert: Buy gifts on 12/10 at 18:00
Reminder: Medical appointment on 15/10/2025 at 14:30
Notice: Check emails today at 16:00
```

### 🇫🇷 Exemples en Français
```
Rappeler: Réunion importante à 15:30
Notifier: Appeler le médecin demain à 09:00
Alerte: Acheter des cadeaux le 12/10 à 18:00
Rappel: Rendez-vous médical le 15/10/2025 à 14:30
Avis: Vérifier les emails aujourd'hui à 16:00
```

### 🌍 Más Ejemplos Multiidioma
Consulta el archivo `ejemplos-multiidioma.md` para ejemplos completos en todos los idiomas soportados.

## ⚙️ Configuración

### Configuración Automática
- **Procesamiento automático**: Activa/desactiva el procesamiento
- **Procesar al guardar**: Procesa automáticamente al guardar notas
- **Procesar al abrir**: Procesa automáticamente al abrir notas
- **Modo debug**: Muestra mensajes de debug en la consola

### Configuración Personalizada
- **Idioma**: Selecciona el idioma para detección de patrones
- **Carpetas excluidas**: Carpetas que no se procesarán
- **Palabras clave personalizadas**: Añade tus propias palabras clave

### Comandos Disponibles

1. **Procesar nota actual**: Procesa la nota que tienes abierta
2. **Procesar todas las notas**: Procesa todas las notas del vault
3. **Limpiar historial**: Limpia el historial de procesamiento

## 🔧 Funcionamiento Técnico

### Flujo de Procesamiento

1. **Detección**: El plugin escanea el texto buscando patrones
2. **Parsing**: Extrae fechas, horas y títulos del texto
3. **Generación**: Crea deeplinks con formato Notelert
4. **Ejecución**: Abre automáticamente los deeplinks
5. **Notificación**: La app móvil procesa y se cierra

### Formato de Deeplink
```
notelert://add?title=Reunión&message=Recordar: Reunión a las 15:30&date=2025-10-11&time=15:30
```

## 🐛 Solución de Problemas

### La app no se abre
- Verifica que Notelert esté instalada en tu dispositivo
- Comprueba que el deeplink sea correcto
- Activa el modo debug para ver los deeplinks generados

### No se detectan patrones
- Verifica que uses las palabras clave correctas
- Comprueba el formato de fecha/hora
- Revisa la configuración de carpetas excluidas

### Errores de fecha
- Usa el formato correcto: DD/MM/YYYY o DD/MM
- Verifica que la fecha sea válida
- Para fechas relativas, usa: hoy, mañana, ayer

## 📋 Requisitos

- **Obsidian**: Versión 0.15.0 o superior
- **Notelert**: App móvil instalada en tu dispositivo
- **Sistema**: Windows, macOS o Linux

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👨‍💻 Autor

**Quim Frances**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)

## 🙏 Agradecimientos

- Equipo de Obsidian por la excelente API
- Comunidad de desarrolladores de plugins
- Usuarios que reportan bugs y sugieren mejoras

---

**¿Tienes problemas o sugerencias?** Abre un issue en GitHub o contacta al autor.

**¿Te gusta el plugin?** ¡Dale una estrella ⭐ en GitHub!