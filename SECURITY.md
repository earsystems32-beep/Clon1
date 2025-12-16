# Medidas de Seguridad Implementadas

Este documento describe todas las medidas de seguridad implementadas en el sistema de administración.

## 1. Autenticación y Autorización

### Protección por PIN
- **Variable de entorno segura**: La contraseña se almacena en `ADMIN_PIN` (nunca en el código)
- **Validación del lado del servidor**: Toda autenticación ocurre en el servidor, imposible de manipular desde el navegador
- **SIN fallback hardcodeado**: La contraseña DEBE estar en las variables de entorno, no hay valor por defecto en el código

### Gestión de Sesiones
- **Tokens criptográficos**: Uso de `crypto.randomBytes(32)` para generar tokens seguros
- **Cookies HTTP-only**: Los tokens de sesión no son accesibles desde JavaScript del navegador
- **Cookie flags de seguridad**:
  - `httpOnly: true` - No accesible desde JavaScript
  - `secure: true` - Solo se envía por HTTPS en producción
  - `sameSite: "strict"` - Protección contra CSRF
  - `maxAge: 24h` - Expiración automática después de 24 horas

### Almacenamiento de Sesiones
- **Session store en memoria**: Sesiones almacenadas con metadata (IP, timestamp)
- **Expiración automática**: Las sesiones expiran después de 24 horas
- **Limpieza periódica**: Limpieza automática de sesiones expiradas cada minuto

## 2. Protección contra Ataques

### Rate Limiting (Límite de Intentos)
- **Máximo 5 intentos fallidos por IP**
- **Bloqueo temporal de 15 minutos** después de 5 intentos fallidos
- **Mensaje informativo**: Indica cuántos minutos quedan del bloqueo
- **Seguimiento por IP**: Cada dirección IP es rastreada independientemente
- **Limpieza automática**: Los intentos antiguos se limpian después del período de bloqueo

### Protección contra Fuerza Bruta
- **Delay intencional**: 1 segundo de espera después de cada intento fallido
- **Limita la velocidad** de los ataques automatizados

### Protección CORS (Cross-Origin)
- **Validación de origen**: Verifica que las peticiones vengan del dominio correcto
- **Variable `ALLOWED_ORIGIN`**: Define qué dominios pueden hacer peticiones
- **Solo en producción**: La validación estricta solo se aplica en entorno de producción

### Validación de Entrada
- **Sanitización de PIN**: Limita entrada a 100 caracteres máximo
- **Validación de tipo**: Verifica que el PIN sea una cadena de texto
- **Protección contra inyección**: Previene ataques de inyección de código

## 3. Headers de Seguridad HTTP

### En Middleware Global
```
X-DNS-Prefetch-Control: on
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### En Respuestas de API
- **X-Content-Type-Options**: Previene sniffing de MIME types
- **X-Frame-Options**: Protege contra clickjacking
- **X-XSS-Protection**: Activa protección XSS del navegador
- **Cache-Control**: Previene caché de datos sensibles
- **Referrer-Policy**: Controla información de referrer

## 4. Protección de Rutas

### Middleware de Next.js
- **Protección de `/sys32`**: Rutas administrativas monitoreadas
- **Headers de tracking**: Marca peticiones sin autenticación
- **Configuración de matcher**: Excluye archivos estáticos del middleware

### Validación de Sesión en Check
- **Verificación de formato de token**: Valida longitud mínima de 20 caracteres
- **Verificación de existencia**: Confirma que el token existe en el session store
- **Verificación de expiración**: Elimina tokens expirados automáticamente
- **Opcional: Binding de IP**: Código incluido (comentado) para validar que la IP coincida

## 5. Logging y Monitoreo

### Logs de Errores
- **Prefijo `[v0]`**: Todos los logs de sistema tienen este prefijo
- **No expone información sensible**: Los errores mostrados al usuario son genéricos
- **Logs detallados en servidor**: Información completa solo en consola del servidor

## 6. Configuración de Producción

### Variables de Entorno Requeridas
```bash
ADMIN_PIN=tu_contraseña_segura_aquí  # REQUERIDO - Mínimo 12 caracteres
ALLOWED_ORIGIN=https://tudominio.com  # Opcional pero recomendado
```

### Recomendaciones
1. **Contraseña fuerte**: Mínimo 12 caracteres, mezcla de letras, números y símbolos
2. **Cambio periódico**: Cambiar la contraseña cada 3-6 meses
3. **HTTPS obligatorio**: Asegurar que el sitio use HTTPS en producción
4. **Monitoreo**: Revisar logs periódicamente para detectar intentos de acceso
5. **Actualizaciones**: Mantener dependencias actualizadas
6. **NUNCA compartir el código con la contraseña**: Si compartes el proyecto, asegurate que la variable de entorno no esté incluida

## 7. Limitaciones Conocidas

### Session Store en Memoria
- **Problema**: Las sesiones se pierden al reiniciar el servidor
- **Solución recomendada**: Para producción a escala, usar Redis o base de datos
- **Para este proyecto**: Aceptable ya que es un sistema pequeño con pocos administradores

### Rate Limiting en Memoria
- **Problema**: El rate limiting se reinicia al reiniciar el servidor
- **Solución recomendada**: Para alta disponibilidad, usar Redis con rate limiting distribuido
- **Para este proyecto**: Suficiente para protección básica

### Sin 2FA (Two-Factor Authentication)
- **Estado actual**: Solo autenticación por PIN
- **Mejora futura**: Implementar TOTP o SMS para segunda capa de seguridad

## 8. Qué NO está protegido

### Código Frontend Visible
- ✅ **Normal**: El HTML, CSS y JavaScript son públicos (así funcionan todos los sitios web)
- ✅ **No es problema**: El diseño puede verse, pero no pueden acceder al panel admin
- ✅ **Separación**: La lógica de autenticación está en el servidor, no en el frontend

### LocalStorage de Configuración
- ✅ **Solo almacena preferencias visuales**: alias, teléfono seleccionado
- ✅ **No contiene secretos**: No hay contraseñas ni tokens en localStorage
- ✅ **Requiere autenticación**: Para modificar la configuración real, necesitan estar autenticados

## 9. Verificación de Seguridad

### Checklist de Implementación
- [x] PIN almacenado en variable de entorno
- [x] Validación del lado del servidor
- [x] Cookies HTTP-only y secure
- [x] Rate limiting contra fuerza bruta
- [x] Headers de seguridad HTTP
- [x] Protección CORS
- [x] Validación y sanitización de entrada
- [x] Sesiones con expiración automática
- [x] Delay en intentos fallidos
- [x] Logging de errores seguro
- [x] Middleware de protección de rutas
- [x] Limpieza automática de datos expirados

## 10. Respuesta a Incidentes

### Si sospechas un acceso no autorizado:
1. Cambiar inmediatamente `ADMIN_PIN` en las variables de entorno
2. Revisar logs del servidor para identificar IPs sospechosas
3. Verificar la configuración guardada (alias, teléfono)
4. Si es necesario, limpiar todas las sesiones reiniciando el servidor

### Si encuentras una vulnerabilidad:
1. No compartir públicamente hasta tener un fix
2. Documentar el problema detalladamente
3. Implementar y probar la solución
4. Actualizar este documento con la corrección
