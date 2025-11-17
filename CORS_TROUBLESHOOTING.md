# 🔧 Troubleshooting CORS - Backend Configuration

## Error Actual
```
Access to fetch at '...' has been blocked by CORS policy: 
Request header field x-api-key is not allowed by Access-Control-Allow-Headers in preflight response.
```

## ✅ Configuración Requerida en Firebase Functions

El backend **debe** responder correctamente a las peticiones OPTIONS (preflight) con estos headers:

```javascript
// En tu Firebase Function, maneja OPTIONS requests:
exports.scheduleEmailReminder = functions.https.onRequest((req, res) => {
  // Manejar preflight (OPTIONS request)
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, x-api-key');
    res.set('Access-Control-Max-Age', '3600');
    return res.status(204).send('');
  }

  // Tu lógica normal aquí...
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key, x-api-key');
  
  // ... resto del código
});
```

## 🔍 Puntos Importantes

1. **Preflight (OPTIONS)**: Debe responder con status 204 y los headers correctos
2. **Headers permitidos**: Debe incluir tanto `X-API-Key` como `x-api-key` (case-insensitive)
3. **Access-Control-Allow-Origin**: `*` o el origen específico
4. **Despliegue**: Asegúrate de que los cambios se hayan desplegado correctamente

## 🧪 Verificar Configuración

Puedes probar el preflight con curl:

```bash
curl -X OPTIONS \
  https://us-central1-notalert-2a44a.cloudfunctions.net/scheduleEmailReminder \
  -H "Origin: app://obsidian.md" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: x-api-key" \
  -v
```

Deberías ver en la respuesta:
```
< Access-Control-Allow-Headers: Content-Type, X-API-Key, x-api-key
< Access-Control-Allow-Origin: *
< Access-Control-Allow-Methods: GET, POST, OPTIONS
```

## 📝 Nota

Si el backend ya está configurado pero sigue fallando:
1. Verifica que el despliegue se haya completado
2. Limpia la caché del navegador/Electron
3. Reinicia Obsidian completamente

