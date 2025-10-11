# 📝 Ejemplos de Uso - Plugin Notelert

Este archivo contiene ejemplos de patrones que el plugin Notelert puede detectar y procesar automáticamente.

## 🔔 Ejemplos Básicos

### Recordatorios Simples
```
Recordar: Reunión importante a las 15:30
Notificar: Llamar al doctor mañana a las 09:00
Alerta: Comprar regalos el 12/10 a las 18:00
Recordatorio: Cita médica el 15/10/2025 a las 14:30
```

### Con Fechas Relativas
```
Aviso: Revisar emails hoy a las 16:00
Reminder: Pagar facturas mañana a las 10:30
Notify: Llamar a mamá ayer a las 20:00
Alert: Backup del sistema hoy a las 23:59
```

## 📅 Ejemplos con Fechas Específicas

### Fechas del Año Actual
```
Recordar: Cumpleaños de Juan el 25/12 a las 12:00
Notificar: Reunión de equipo el 31/12 a las 17:00
Alerta: Entrega de proyecto el 15/06 a las 18:30
```

### Fechas con Año Completo
```
Recordatorio: Vacaciones el 15/07/2025 a las 09:00
Aviso: Cita médica el 20/03/2025 a las 14:30
Notify: Evento importante el 01/01/2026 a las 00:00
```

## ⏰ Ejemplos con Diferentes Formatos de Hora

### Formato 24 Horas
```
Recordar: Desayuno a las 08:00
Notificar: Almuerzo a las 13:30
Alerta: Cena a las 20:00
Recordatorio: Dormir a las 23:00
```

### Formato con Punto
```
Aviso: Reunión a las 09.30
Reminder: Llamada a las 16.45
Notify: Ejercicio a las 19.00
Alert: Meditación a las 21.15
```

## 🎯 Ejemplos de Casos de Uso Reales

### Trabajo
```
Recordar: Reunión con el cliente mañana a las 10:00
Notificar: Enviar reporte el 30/11 a las 17:00
Alerta: Revisar emails hoy a las 09:00
Recordatorio: Llamada con el equipo el 15/12/2025 a las 14:30
```

### Personal
```
Aviso: Comprar regalos de Navidad el 20/12 a las 16:00
Reminder: Llamar a la abuela mañana a las 19:00
Notify: Cita con el dentista el 10/01/2025 a las 11:30
Alert: Pagar el alquiler el 01/12 a las 09:00
```

### Salud
```
Recordar: Tomar medicamento hoy a las 08:00
Notificar: Cita médica el 15/01/2025 a las 15:30
Alerta: Ejercicio mañana a las 07:00
Recordatorio: Revisión dental el 20/02/2025 a las 10:00
```

### Estudios
```
Aviso: Examen de matemáticas el 25/11 a las 09:00
Reminder: Entrega de tarea mañana a las 23:59
Notify: Clase de inglés hoy a las 16:00
Alert: Proyecto final el 15/12/2025 a las 18:00
```

## 🔧 Ejemplos de Configuración Personalizada

### Palabras Clave Personalizadas
Si añades estas palabras clave en la configuración:
- `Importante:`
- `Urgente:`
- `No olvidar:`

Podrás usar:
```
Importante: Reunión de directorio el 30/11 a las 16:00
Urgente: Llamar al banco hoy a las 14:00
No olvidar: Comprar leche mañana a las 18:00
```

## ⚠️ Notas Importantes

### Formatos Soportados
- **Fechas**: DD/MM, DD/MM/YYYY, DD-MM-YYYY
- **Horas**: HH:MM, H:MM, HH.MM, H.MM
- **Fechas relativas**: hoy, mañana, ayer

### Limitaciones
- Las fechas deben ser válidas
- Las horas deben estar en formato 24h
- Solo se procesan archivos .md
- Las carpetas excluidas no se procesan

### Consejos
- Usa palabras clave claras al inicio de la línea
- Incluye tanto fecha como hora para mejor precisión
- Revisa la configuración si no se detectan patrones
- Usa el modo debug para ver qué se está procesando

## 🧪 Pruebas

Para probar el plugin:

1. **Activa el plugin** en Configuración → Plugins
2. **Escribe uno de los ejemplos** en una nota
3. **Guarda la nota** (Ctrl+S)
4. **Verifica** que se abra la app Notelert
5. **Comprueba** que la notificación se haya creado

### Comandos de Prueba
- `Ctrl+P` → "Procesar nota actual para Notelert"
- `Ctrl+P` → "Procesar todas las notas para Notelert"
- `Ctrl+P` → "Limpiar historial de procesamiento"

---

**¿Necesitas ayuda?** Consulta el README.md o abre un issue en GitHub.
