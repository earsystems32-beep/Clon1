# Instrucciones para publicar en Netlify

## 1. Configurar Variables de Entorno

Después de publicar tu sitio en Netlify, debes configurar las variables de entorno:

1. Ve a tu sitio en Netlify Dashboard
2. Click en "Site settings" → "Environment variables"
3. Agrega las siguientes variables:
   
   **Requeridas:**
   - **Key**: `ADMIN_PIN`
   - **Value**: `tu_contraseña_segura_aquí` 
   - **⚠️ IMPORTANTE**: Usa una contraseña única y fuerte (12+ caracteres, letras, números y símbolos)
   
   **Opcionales (recomendadas para mayor seguridad):**
   - **Key**: `ALLOWED_ORIGIN`
   - **Value**: `https://tudominio.netlify.app` (tu URL de producción)

4. Click en "Save"
5. Redeploya el sitio para que tome efecto

## 2. Seguridad Implementada

Este proyecto incluye múltiples capas de seguridad:

### Autenticación
✅ **Contraseña en variable de entorno** - No está en el código fuente
✅ **Validación del lado del servidor** - Imposible de manipular desde el navegador
✅ **Cookies HTTP-only** - Los tokens de sesión no son accesibles desde JavaScript
✅ **Sesiones seguras** - Tokens criptográficos con expiración automática (24h)

### Protección contra Ataques
✅ **Rate Limiting** - Máximo 5 intentos fallidos por IP, bloqueo de 15 minutos
✅ **Anti fuerza bruta** - Delay de 1 segundo después de cada intento fallido
✅ **Protección CORS** - Valida el origen de las peticiones
✅ **Headers de seguridad** - Protección contra XSS, clickjacking, y otros ataques

### Validación
✅ **Sanitización de entrada** - Limpia y valida todos los datos de entrada
✅ **Validación de formato de token** - Verifica tokens de sesión
✅ **Limpieza automática** - Elimina sesiones y datos expirados

Ver `SECURITY.md` para documentación completa de todas las medidas de seguridad.

## 3. Cambiar la Contraseña

Para cambiar tu contraseña:
1. Ve a Netlify → Site settings → Environment variables
2. Edita `ADMIN_PIN` con tu nueva contraseña
3. **Importante**: Usa una contraseña fuerte (12+ caracteres, letras, números y símbolos)
4. Guarda y redeploya el sitio

## 4. Acceso al Panel de Admin

- **Ruta**: `/sys32` (no `/admin`)
- **Contraseña**: La que configuraste en `ADMIN_PIN`
- **Sesión**: Dura 24 horas, después debes volver a ingresar el PIN

## 5. Limitaciones

⚠️ **El diseño/HTML/CSS sigue siendo visible** - Esto es normal en cualquier sitio web
⚠️ **Pueden copiar el diseño** - Pero NO pueden acceder al panel de admin sin tu contraseña
⚠️ **Alguien podría crear su propia copia** - Pero sería completamente independiente de tu sitio
⚠️ **5 intentos máximo** - Después de 5 intentos fallidos, se bloquea la IP por 15 minutos

## 6. Seguridad Adicional Recomendada

Para máxima seguridad, considera:

### Contraseñas
- Usar contraseñas largas y complejas (12+ caracteres mínimo)
- Cambiar la contraseña cada 3-6 meses
- No compartir la contraseña por WhatsApp/Email sin cifrar
- Usar un gestor de contraseñas (Bitwarden, 1Password, etc.)

### Configuración
- Configurar `ALLOWED_ORIGIN` con tu dominio exacto en producción
- Usar HTTPS siempre (Netlify lo hace por defecto)
- Revisar periódicamente los logs de acceso en Netlify
- No usar la misma contraseña para otras cuentas

### Monitoreo
- Revisar el panel cada semana para detectar cambios no autorizados
- Si notas actividad sospechosa, cambiar la contraseña inmediatamente
- Verificar que la configuración guardada (alias, teléfono) sea la correcta

## 7. Solución de Problemas

### "PIN incorrecto" aunque sea correcto
- Verifica que hayas guardado `ADMIN_PIN` en Netlify
- Asegúrate de haber redeployado el sitio después de agregar la variable
- Revisa que no haya espacios extras al inicio o final de la contraseña

### "Demasiados intentos fallidos"
- Tu IP fue bloqueada por 15 minutos después de 5 intentos fallidos
- Espera 15 minutos e intenta de nuevo
- Verifica que estés usando la contraseña correcta

### La sesión se cierra sola
- Las sesiones expiran después de 24 horas por seguridad
- Simplemente vuelve a ingresar el PIN

## 8. Respaldo y Recuperación

### Si pierdes acceso al panel
1. Ve a Netlify → Site settings → Environment variables
2. Cambia `ADMIN_PIN` a una nueva contraseña que recuerdes
3. Redeploya el sitio
4. Usa la nueva contraseña para ingresar

### Si necesitas restaurar configuración
- La configuración se guarda en localStorage del navegador
- Si borras datos del navegador, se perderá
- Anota tu alias y teléfono de soporte en un lugar seguro
