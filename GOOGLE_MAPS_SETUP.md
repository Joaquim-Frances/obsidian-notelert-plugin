# Configuración de Google Maps Geocoding API

## Paso 1: Crear proyecto en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Inicia sesión con tu cuenta de Google
3. Crea un nuevo proyecto o selecciona uno existente:
   - Haz clic en el selector de proyectos (arriba a la izquierda)
   - Clic en "NUEVO PROYECTO"
   - Nombre: `Notelert` (o el que prefieras)
   - Clic en "CREAR"

## Paso 2: Habilitar la Geocoding API

1. En el menú lateral, ve a **"APIs y servicios"** > **"Biblioteca"**
2. Busca "**Geocoding API**"
3. Haz clic en el resultado
4. Clic en **"HABILITAR"**
5. Espera a que se habilite (puede tardar unos segundos)

## Paso 3: Crear API Key

1. Ve a **"APIs y servicios"** > **"Credenciales"**
2. Clic en **"+ CREAR CREDENCIALES"** > **"Clave de API"**
3. Se creará una API key automáticamente
4. **Copia la API key** (formato: `AIza...`)
5. ⚠️ **NO la compartas públicamente**

## Paso 4: Restringir la API Key (Recomendado para producción)

### Opción A: Crear la clave con restricciones (Recomendado)

Cuando aparezca el modal "Protect your API key":

**Opción más simple (Recomendada para empezar):**
1. Haz clic en **"MAYBE LATER"** o **"CREATE KEY"** directamente
2. Esto creará la clave sin restricciones de aplicación
3. **Copia la API key** que se genera
4. Luego puedes configurar las restricciones editando la clave (ver paso siguiente)

**Si prefieres configurar restricciones ahora:**
1. **Restricciones de aplicación**: 
   - Para un plugin de Obsidian, elige **"IP addresses"** (Direcciones IP)
   - ⚠️ **NO uses "Websites"** - eso es solo para aplicaciones web
   - ⚠️ **NO uses "Android apps" o "iOS apps"** - Obsidian no es una app móvil nativa

2. **Si no sabes si tienes IP fija:**
   - Puedes dejar la lista de IPs vacía o añadir tu IP actual
   - La mayoría de conexiones domésticas tienen IPs dinámicas (cambian)
   - Puedes editar la clave después para quitar esta restricción si causa problemas

3. Haz clic en **"CREATE KEY"**

3. **Después de crear la clave**, edítala para añadir restricciones de API (IMPORTANTE para seguridad):
   - En la lista de credenciales, haz clic en tu API key
   - En **"Restricciones de API"**, selecciona **"Restringir clave"**
   - En la lista, marca solo:
     - ✅ **Geocoding API**
     - ✅ **Places API** (opcional, si quieres usar autocompletado en el futuro)
   - Clic en **"GUARDAR"**
   
   ⚠️ **Nota**: Si elegiste "Maybe Later", la clave no tendrá restricciones de aplicación. Esto está bien para empezar, pero es recomendable añadir la restricción de API (solo Geocoding API) para mayor seguridad.

### Opción B: Crear sin restricciones y configurarlas después

Si ya creaste la clave sin restricciones:

1. En la lista de credenciales, haz clic en tu API key
2. En **"Restricciones de API"**, selecciona **"Restringir clave"**
3. Marca solo **Geocoding API**
4. En **"Restricciones de aplicación"**, puedes dejar **"Ninguna"** o configurar **"Direcciones IP"** si tienes IPs fijas
5. Clic en **"GUARDAR"**

### ¿Qué restricciones usar para Obsidian?

**Para desarrollo/pruebas:**
- ✅ Restricción de API: Solo **Geocoding API**
- ✅ Restricción de aplicación: **Direcciones IP** con lista vacía (o tu IP actual)

**Para producción/uso personal:**
- ✅ Restricción de API: Solo **Geocoding API**
- ✅ Restricción de aplicación: **Direcciones IP** con tu IP actual (aunque sea dinámica, funcionará mientras no cambie)
- Si tu IP cambia y deja de funcionar, puedes editar la clave y actualizar la IP o quitar la restricción de IPs

⚠️ **Importante**: Las restricciones de aplicación como "Websites", "Android apps" o "iOS apps" NO son apropiadas para Obsidian, que es una aplicación de escritorio basada en Electron.

## Paso 5: Configurar en Obsidian

1. Abre Obsidian
2. Ve a **Settings** (⚙️) > **Notelert**
3. En la sección **"Geocodificación de Ubicaciones"**:
   - **Proveedor de Geocodificación**: Selecciona **"Google Maps - Requiere API Key"**
   - **Google Maps API Key**: Pega tu API key
4. Guarda los cambios

## Paso 6: Probar la configuración

1. Abre una nota en Obsidian
2. Escribe `:#` para abrir el selector de ubicaciones
3. Busca una dirección (ej: "Madrid, Spain")
4. Si funciona correctamente, verás resultados de Google Maps
5. Si hay error, revisa:
   - Que la API key esté correctamente copiada
   - Que la Geocoding API esté habilitada
   - Que no hayas excedido los límites

## Límites y Costos

### Tier Gratuito:
- **$200 USD de crédito mensual** (equivalente a ~40,000 requests)
- **10,000 requests/mes gratis** para Geocoding API
- Después: **$5 USD por cada 1,000 requests adicionales**

### Monitoreo de uso:
1. Ve a **"APIs y servicios"** > **"Panel"**
2. Revisa el uso de la Geocoding API
3. Configura alertas de facturación en **"Facturación"** > **"Presupuestos y alertas"**

## Seguridad

⚠️ **IMPORTANTE:**
- Nunca subas tu API key a repositorios públicos
- Usa restricciones de API para limitar el uso
- Configura alertas de facturación para evitar sorpresas
- Si tu API key se expone, revócala inmediatamente y crea una nueva

## Solución de Problemas

### Error: "API key not valid"
- Verifica que la API key esté correctamente copiada
- Asegúrate de que la Geocoding API esté habilitada
- Revisa las restricciones de la API key

### Error: "This API project is not authorized"
- Verifica que la Geocoding API esté habilitada en tu proyecto
- Espera unos minutos después de habilitarla

### Error: "You have exceeded your quota"
- Has excedido los 10,000 requests/mes gratis
- Revisa tu uso en el panel de Google Cloud
- Considera usar Nominatim como alternativa gratuita

### No aparecen resultados
- Verifica tu conexión a internet
- Revisa la consola de Obsidian (Ctrl/Cmd + Shift + I) para ver errores
- Activa el modo debug en la configuración del plugin

### Error: "This IP, site or mobile application is not authorized"
- Tu IP actual no está en la lista de IPs permitidas
- Ve a Google Cloud Console > Credenciales > Edita tu API key
- Añade tu IP actual (puedes verla en https://whatismyipaddress.com/)
- O elimina todas las IPs de la lista si prefieres (menos seguro pero más flexible)
- Guarda los cambios

## Alternativas Gratuitas

Si prefieres no usar Google Maps, el plugin incluye:
- **Nominatim (OpenStreetMap)** - Completamente gratuito, sin API key
- **Mapbox** - 100,000 requests/mes gratis
- **LocationIQ** - 5,000 requests/día gratis

Cambia el proveedor en la configuración del plugin.

