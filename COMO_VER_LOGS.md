# Cómo ver logs en Obsidian

## Método 1: Consola de Desarrollador (Recomendado)

1. **Abrir la consola de desarrollador:**
   - **Windows/Linux**: Presiona `Ctrl + Shift + I` (o `Ctrl + Shift + J`)
   - **Mac**: Presiona `Cmd + Option + I` (o `Cmd + Option + J`)
   - O ve a: `Help` > `Toggle Developer Tools`

2. **Ver los logs del plugin:**
   - En la consola, busca mensajes que empiecen con `[Notelert]`
   - Los logs aparecerán cuando:
     - Cargues ubicaciones desde el backend
     - Haya errores en las peticiones
     - Se ejecuten acciones del plugin

3. **Filtrar logs:**
   - En la consola, puedes escribir `[Notelert]` en el filtro para ver solo los logs del plugin

## Método 2: Activar Modo Debug en Settings

1. Ve a `Settings` > `Notelert` (o `Configuración` > `Notelert`)
2. Activa el toggle `Modo debug`
3. Los logs aparecerán en la consola de desarrollador (Método 1)

## Qué buscar en los logs

Cuando cargas ubicaciones, deberías ver:
```
[Notelert] [Ubicaciones] Iniciando carga de ubicaciones. Token presente: true, Longitud: 64
[Notelert] [Ubicaciones] Llamando a: https://us-central1-notalert-2a44a.cloudfunctions.net/pluginListLocations
[Notelert] [Ubicaciones] Token (primeros 8 chars): abc12345...
[Notelert] [Ubicaciones] Respuesta recibida: status=200
[Notelert] [Ubicaciones] Respuesta parseada: success=true, count=2, locations=2
[Notelert] [Ubicaciones] ✅ Ubicaciones cargadas: 2
[Notelert] [Ubicaciones]   1. Casa (40.4168, -3.7038)
[Notelert] [Ubicaciones]   2. Trabajo (40.4168, -3.7038)
```

Si hay errores, verás:
```
[Notelert] [Ubicaciones] ❌ Error HTTP 403: Token inválido o expirado
```

## Solución de problemas

- **Si no ves logs**: Asegúrate de que el modo debug esté activado en Settings
- **Si ves errores 401/403**: Verifica que el token sea correcto y no haya expirado
- **Si ves 0 ubicaciones**: Verifica que tengas ubicaciones guardadas en la app móvil

