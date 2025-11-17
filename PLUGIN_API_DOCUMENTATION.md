# 📧 Documentación API - Plugin de Obsidian para Notelert

## Resumen

El plugin de Obsidian puede usar directamente los endpoints de Firebase Functions para programar emails cuando se ejecuta en **desktop** (Windows, macOS, Linux). En **móvil** (Android/iOS), debe usar el deep link como hasta ahora.

## 🔒 Autenticación

**IMPORTANTE:** Todos los endpoints requieren una **API Key** para autenticación. Debes incluirla en el header `X-API-Key` en cada request.

La API Key se proporciona al configurar el plugin. **No la compartas públicamente**.

## 🎯 Lógica de Decisión

```
Si (plataforma == desktop):
    → Llamar directamente a Firebase Functions API
    → Solo notificaciones por email (no push)
Si (plataforma == móvil):
    → Usar deep link notelert://add
    → Notificaciones push + email (según configuración del usuario)
```

## 🔗 Endpoints Disponibles

### Base URL
```
https://us-central1-notalert-2a44a.cloudfunctions.net
```

### 1. Programar Email de Recordatorio

**Endpoint:** `POST /scheduleEmailReminder`

**URL Completa:**
```
https://us-central1-notalert-2a44a.cloudfunctions.net/scheduleEmailReminder
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "to": "usuario@email.com",
  "title": "Título de la notificación",
  "message": "Mensaje de la notificación",
  "scheduledDate": "2024-01-15T14:30:00.000Z",
  "notificationId": "unique-id-12345",
  "userId": "google-user-id-optional"
}
```

**Campos Requeridos:**
- `to` (string): Email del usuario que recibirá la notificación
- `title` (string): Título de la notificación
- `message` (string): Mensaje/descripción de la notificación
- `scheduledDate` (string): Fecha y hora en formato ISO 8601 (UTC)
- `notificationId` (string): ID único de la notificación (generar UUID o timestamp único)

**Campos Opcionales:**
- `userId` (string): ID del usuario de Google (para separación por usuario en la base de datos)

**Ejemplo de Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Email programado correctamente",
  "notificationId": "unique-id-12345"
}
```

**Ejemplos de Errores:**

**401 - No autorizado (API Key faltante o inválida):**
```json
{
  "error": "Unauthorized",
  "message": "API key inválida o faltante. Proporciona una API key válida en el header X-API-Key."
}
```

**400 - Campos faltantes:**
```json
{
  "error": "Missing required fields",
  "required": ["to", "title", "message", "scheduledDate", "notificationId"]
}
```

**400 - Email inválido:**
```json
{
  "error": "Invalid email format"
}
```

**429 - Límite alcanzado:**
```json
{
  "error": "Límite alcanzado",
  "message": "Has alcanzado el límite máximo de 100 emails programados. Elimina algunas notificaciones antes de crear nuevas."
}
```

---

### 2. Cancelar Email Programado

**Endpoint:** `POST /cancelScheduledEmail`

**URL Completa:**
```
https://us-central1-notalert-2a44a.cloudfunctions.net/cancelScheduledEmail
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "notificationId": "unique-id-12345",
  "userId": "google-user-id-optional"
}
```

**Campos Requeridos:**
- `notificationId` (string): ID de la notificación a cancelar

**Campos Opcionales:**
- `userId` (string): ID del usuario de Google

**Ejemplo de Respuesta Exitosa (200):**
```json
{
  "success": true,
  "message": "Email programado cancelado"
}
```

**Ejemplo de Error (404):**
```json
{
  "error": "Email programado no encontrado"
}
```

---

## 💻 Ejemplo de Implementación (TypeScript/JavaScript)

```typescript
// Configuración
const FIREBASE_FUNCTION_BASE_URL = 'https://us-central1-notalert-2a44a.cloudfunctions.net';
const SCHEDULE_EMAIL_URL = `${FIREBASE_FUNCTION_BASE_URL}/scheduleEmailReminder`;
const CANCEL_EMAIL_URL = `${FIREBASE_FUNCTION_BASE_URL}/cancelScheduledEmail`;

// Función para programar email
async function scheduleEmailReminder(
  userEmail: string,
  title: string,
  message: string,
  scheduledDate: Date,
  notificationId: string,
  apiKey: string, // API Key requerida
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(SCHEDULE_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey, // 🔒 API Key en header
      },
      body: JSON.stringify({
        to: userEmail,
        title: title,
        message: message,
        scheduledDate: scheduledDate.toISOString(), // Importante: formato ISO 8601
        notificationId: notificationId,
        userId: userId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error de red al programar email',
    };
  }
}

// Función para cancelar email
async function cancelScheduledEmail(
  notificationId: string,
  apiKey: string, // API Key requerida
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(CANCEL_EMAIL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey, // 🔒 API Key en header
      },
      body: JSON.stringify({
        notificationId: notificationId,
        userId: userId || null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || errorData.message || `HTTP ${response.status}`,
      };
    }

    const result = await response.json();
    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error de red al cancelar email',
    };
  }
}

// Ejemplo de uso
async function createReminderFromObsidian() {
  const userEmail = 'usuario@email.com'; // Obtener de configuración del plugin
  const apiKey = 'tu-api-key-secreta'; // Obtener de configuración del plugin (NUNCA hardcodear)
  const title = 'Reunión importante'; // Título de la nota en Obsidian
  const message = 'Línea actual donde se añade el recordatorio'; // Contenido de la línea
  const scheduledDate = new Date('2024-01-15T14:30:00'); // Fecha/hora del recordatorio
  const notificationId = `obsidian-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; // ID único
  
  const result = await scheduleEmailReminder(
    userEmail,
    title,
    message,
    scheduledDate,
    notificationId,
    apiKey // 🔒 API Key requerida
  );

  if (result.success) {
    console.log('✅ Email programado correctamente');
    // Guardar notificationId en el plugin para poder cancelarlo después si es necesario
  } else {
    console.error('❌ Error:', result.error);
  }
}
```

---

## 📋 Flujo Recomendado para el Plugin

### 1. Detectar Plataforma

```typescript
function isDesktop(): boolean {
  // En Obsidian, puedes usar:
  // - app.isMobile === false
  // - o detectar el entorno de Node.js
  return !app.isMobile; // Ejemplo para Obsidian
}
```

### 2. Lógica de Creación de Recordatorio

```typescript
async function createReminder(
  title: string,
  message: string,
  date: Date,
  userEmail: string,
  userId?: string
) {
  const notificationId = generateUniqueId();
  
  if (isDesktop()) {
    // Desktop: Llamar directamente a Firebase Functions
    const result = await scheduleEmailReminder(
      userEmail,
      title,
      message,
      date,
      notificationId,
      userId
    );
    
    if (result.success) {
      showNotice('✅ Recordatorio por email programado correctamente');
    } else {
      showNotice(`❌ Error: ${result.error}`);
    }
  } else {
    // Móvil: Usar deep link
    const deepLink = buildDeepLink(title, message, date);
    await openDeepLink(deepLink);
  }
}
```

### 3. Generar ID Único

```typescript
function generateUniqueId(): string {
  // Opción 1: Timestamp + random
  return `obsidian-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Opción 2: UUID (si tienes una librería)
  // return uuidv4();
  
  // Opción 3: Basado en contenido de la nota
  // return `obsidian-${hash(title + message + date)}`;
}
```

---

## ⚠️ Consideraciones Importantes

### 1. Formato de Fecha
- **Siempre usar ISO 8601 en UTC**: `"2024-01-15T14:30:00.000Z"`
- Ejemplo en JavaScript: `new Date().toISOString()`

### 2. Límites
- **Máximo 100 emails programados por usuario** (si se proporciona `userId`)
- Si se alcanza el límite, se retorna error 429

### 3. Validaciones del Backend
- El email debe tener formato válido
- La fecha debe ser futura (si es pasada, se envía inmediatamente)
- Todos los campos requeridos deben estar presentes

### 4. Manejo de Errores
- Siempre verificar `response.ok` antes de procesar
- Leer el cuerpo de error con `await response.json()`
- Mostrar mensajes claros al usuario

### 5. CORS
- Los endpoints tienen CORS habilitado (`Access-Control-Allow-Origin: *`)
- No se requieren headers especiales adicionales

### 6. Timeouts
- Recomendado: timeout de 10 segundos para las requests
- Si el servidor no responde, mostrar error al usuario

---

## 🔐 Seguridad

### Notas sobre `userId`:
- El `userId` es **opcional** pero recomendado
- Si se proporciona, los emails se separan por usuario en la base de datos
- Si no se proporciona, se usa la estructura antigua (compatibilidad)
- El `userId` debería ser el ID de Google del usuario (si está disponible en el plugin)

### Rate Limiting:
- El backend valida límites por usuario
- Si un usuario intenta crear más de 100 emails, recibirá error 429

---

## 📝 Ejemplo Completo de Integración

```typescript
// settings.ts (configuración del plugin)
export interface NotelertSettings {
  userEmail: string;
  userId?: string; // Opcional: ID de Google del usuario
  useDirectAPI: boolean; // true para desktop, false para móvil
}

// main.ts (código principal del plugin)
import { Notice } from 'obsidian';

const FIREBASE_FUNCTION_BASE_URL = 'https://us-central1-notalert-2a44a.cloudfunctions.net';

export async function createNotelertReminder(
  settings: NotelertSettings,
  title: string,
  message: string,
  scheduledDate: Date
): Promise<void> {
  // Detectar si estamos en desktop
  const isDesktop = !app.isMobile;
  
  if (isDesktop && settings.useDirectAPI) {
    // Usar API directa
    const notificationId = `obsidian-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const response = await fetch(
        `${FIREBASE_FUNCTION_BASE_URL}/scheduleEmailReminder`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: settings.userEmail,
            title: title,
            message: message,
            scheduledDate: scheduledDate.toISOString(),
            notificationId: notificationId,
            userId: settings.userId || null,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        new Notice(`❌ Error: ${error.error || error.message}`);
        return;
      }

      const result = await response.json();
      new Notice('✅ Recordatorio por email programado correctamente');
    } catch (error: any) {
      new Notice(`❌ Error de conexión: ${error.message}`);
    }
  } else {
    // Usar deep link (móvil o si useDirectAPI está deshabilitado)
    const deepLink = buildNotelertDeepLink(title, message, scheduledDate);
    // ... código para abrir deep link
  }
}

function buildNotelertDeepLink(
  title: string,
  message: string,
  date: Date
): string {
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].substring(0, 5);
  
  return `notelert://add?` +
    `title=${encodeURIComponent(title)}&` +
    `message=${encodeURIComponent(message)}&` +
    `date=${dateStr}&` +
    `time=${timeStr}&` +
    `type=time`;
}
```

---

## 🧪 Testing

### Probar con curl:

```bash
# Programar email
curl -X POST https://us-central1-notalert-2a44a.cloudfunctions.net/scheduleEmailReminder \
  -H "Content-Type: application/json" \
  -d '{
    "to": "test@example.com",
    "title": "Test Reminder",
    "message": "This is a test",
    "scheduledDate": "2024-12-31T23:59:00.000Z",
    "notificationId": "test-12345"
  }'

# Cancelar email
curl -X POST https://us-central1-notalert-2a44a.cloudfunctions.net/cancelScheduledEmail \
  -H "Content-Type: application/json" \
  -d '{
    "notificationId": "test-12345"
  }'
```

---

## 📞 Soporte

Si tienes problemas con la API:
1. Verifica que la URL base sea correcta
2. Verifica el formato de la fecha (ISO 8601)
3. Verifica que todos los campos requeridos estén presentes
4. Revisa los logs de Firebase Functions: `firebase functions:log`

---

## ✅ Checklist de Implementación

- [ ] **Configurar API Key** en la configuración del plugin (campo de texto oculto)
- [ ] Detectar si estamos en desktop vs móvil
- [ ] Obtener email del usuario desde configuración del plugin
- [ ] Obtener API Key desde configuración del plugin
- [ ] Generar `notificationId` único para cada recordatorio
- [ ] Formatear fecha correctamente (ISO 8601)
- [ ] Implementar llamada a `scheduleEmailReminder` con header `X-API-Key`
- [ ] Manejar errores (especialmente 401 Unauthorized)
- [ ] Mostrar mensajes claros al usuario
- [ ] (Opcional) Implementar cancelación de emails programados
- [ ] (Opcional) Guardar `notificationId` para poder cancelar después

## 🔑 Obtener la API Key

La API Key se configura en Firebase Secrets. Contacta al administrador de Notelert para obtenerla.

**IMPORTANTE:** 
- Nunca hardcodees la API Key en el código
- Guárdala en la configuración del plugin (encriptada si es posible)
- No la compartas públicamente
- Si se filtra, contacta inmediatamente para rotarla

---

**Última actualización:** 2024-01-15

