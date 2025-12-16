# Sistema de Pagos - LUX23

Sistema de generación de links de pago con panel de administración seguro.

## Características

- ✨ Generación de links de pago (Alias y CBU)
- 🔒 Panel de administración protegido en `/sys32`
- 🛡️ Seguridad multinivel (rate limiting, CORS, tokens seguros)
- 📱 Diseño responsive
- ⚡ Optimizado para rendimiento

## Instalación Local

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Crear archivo `.env.local` basado en `.env.example`
4. Configurar `ADMIN_PIN` con tu contraseña
5. Ejecutar: `npm run dev`
6. Abrir: `http://localhost:3000`

## Deploy en Netlify

Ver instrucciones completas en `INSTRUCCIONES_NETLIFY.md`

**Pasos rápidos:**
1. Conectar repositorio a Netlify
2. Configurar variable de entorno `ADMIN_PIN` en Netlify
3. Deploy automático

## Acceso al Panel Admin

- **URL**: `/sys32`
- **Contraseña**: Configurada en variable `ADMIN_PIN`
- **Sesión**: 24 horas

## Seguridad

Este proyecto incluye:
- Rate limiting (5 intentos/15 min)
- Cookies HTTP-only seguras
- Validación CORS
- Headers de seguridad
- Protección contra fuerza bruta
- Sanitización de inputs

Ver `SECURITY.md` y `SECURITY_CHECKLIST.md` para más detalles.

## Tecnologías

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Lucide Icons

## Variables de Entorno Requeridas

```env
ADMIN_PIN=tu_contraseña_segura_aquí
ALLOWED_ORIGIN=https://tudominio.com (opcional)
```

## Licencia

Todos los derechos reservados.
