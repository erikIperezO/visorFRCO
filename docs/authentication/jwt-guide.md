# 🔐 Autenticación JWT Implementada

**Fecha:** 2025-10-23
**Estado:** ✅ Completado y funcional

---

## 🎯 Resumen

Se ha implementado un sistema completo de autenticación con **JSON Web Tokens (JWT)** que proporciona seguridad real tanto en backend como frontend.

---

## 📋 Componentes Implementados

### 1. **Backend (Go)**

#### Archivo nuevo: `back/jwt.go`
- ✅ `GenerateJWT()` - Genera tokens firmados
- ✅ `ValidateJWT()` - Valida y parsea tokens
- ✅ `ExtractToken()` - Extrae token del header
- ✅ Claims personalizados con datos del usuario

#### Archivos modificados:
- ✅ `back/auth.go` - Login genera y retorna token
- ✅ `back/middleware.go` - Valida tokens en cada request
- ✅ `back/config.go` - Soporte para JWT_SECRET en .env

### 2. **Frontend (JavaScript)**

#### Archivos modificados:
- ✅ `front/login.js` - Guarda token en localStorage
- ✅ `front/script.js` - Envía token en cada petición
- ✅ `front/admin.js` - Envía token en peticiones admin

---

## 🔑 Cómo Funciona

### Flujo Completo:

```
1. Usuario ingresa credenciales
   ↓
2. Backend valida con bcrypt
   ↓
3. Backend genera token JWT (válido 24h)
   ↓
4. Frontend guarda token en localStorage
   ↓
5. Cada petición incluye: Authorization: Bearer TOKEN
   ↓
6. Backend valida token en middleware
   ↓
7. Si válido → Procesa request
   Si inválido → Error 401
```

---

## 🔐 Estructura del Token JWT

### Claims incluidos:
```json
{
  "user_id": 1,
  "username": "admin",
  "rol_id": 1,
  "rol_name": "admin",
  "exp": 1730000000,  // Expira en 24 horas
  "iat": 1729913600,  // Emitido en
  "nbf": 1729913600,  // No antes de
  "iss": "visor-pdf-api"
}
```

### Firma:
- Algoritmo: **HS256** (HMAC SHA-256)
- Clave secreta: Variable de entorno `JWT_SECRET`

---

## 🛡️ Seguridad

### Características implementadas:

1. **Tokens firmados**
   - Imposible de falsificar sin la clave secreta
   - Verificación criptográfica en cada request

2. **Expiración automática**
   - Tokens válidos por 24 horas
   - Después deben hacer login nuevamente

3. **Información del usuario embebida**
   - No requiere consultar BD en cada request
   - Rol y permisos ya en el token

4. **Validación estricta**
   - Formato correcto (Bearer TOKEN)
   - Firma válida
   - No expirado
   - Algoritmo correcto

### Protección por nivel:

| Endpoint | Middleware | Validación |
|----------|-----------|------------|
| `/api/login` | Ninguno | Público |
| `/api/pdf` | AuthMiddleware | Token válido |
| `/api/municipios` | AuthMiddleware | Token válido |
| `/api/localidades` | AuthMiddleware | Token válido |
| `/api/admin/*` | AdminMiddleware | Token válido + rol=admin |

---

## 🔧 Configuración

### Variables de entorno (.env):

```env
# Clave secreta para JWT (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=mi_clave_super_secreta_para_jwt_cambiar_en_produccion_123456
```

### Generar clave segura para producción:

```bash
# Linux/Mac
openssl rand -base64 64

# O en Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

---

## 💻 Código Frontend

### Helper de autenticación (script.js):

```javascript
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');

    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    return fetch(url, authOptions);
}
```

### Uso:
```javascript
// ANTES:
const response = await fetch(`${API_BASE}/pdf?...`);

// DESPUÉS:
const response = await authenticatedFetch(`${API_BASE}/pdf?...`);
```

---

## 🔍 Validación en Middlewares

### AuthMiddleware (usuarios autenticados):

```go
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Extraer token del header
        authHeader := r.Header.Get("Authorization")
        tokenString := ExtractToken(authHeader)

        // Validar token
        claims, err := ValidateJWT(tokenString)
        if err != nil {
            http.Error(w, "No autorizado", 401)
            return
        }

        // Agregar claims al contexto
        ctx := context.WithValue(r.Context(), "claims", claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    }
}
```

### AdminMiddleware (solo administradores):

```go
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Validar token
        claims, err := ValidateJWT(tokenString)

        // Verificar rol de admin
        if claims.RolID != 1 && claims.RolName != "admin" {
            http.Error(w, "Acceso denegado", 403)
            return
        }

        next.ServeHTTP(w, r.WithContext(ctx))
    }
}
```

---

## 📊 Ciclo de Vida del Token

```
┌─────────────────────────────────────────────┐
│  1. LOGIN                                   │
│     Usuario: admin                          │
│     Password: admin123                      │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  2. BACKEND GENERA TOKEN                    │
│     Token: eyJhbGciOiJIUzI1NiIs...         │
│     Válido: 24 horas                        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  3. FRONTEND GUARDA TOKEN                   │
│     localStorage.setItem('authToken', ...)  │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  4. CADA REQUEST INCLUYE TOKEN              │
│     Authorization: Bearer eyJhbGciO...      │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  5. BACKEND VALIDA TOKEN                    │
│     ✓ Firma correcta                        │
│     ✓ No expirado                           │
│     ✓ Claims válidos                        │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│  6. PROCESA REQUEST                         │
│     Retorna datos solicitados               │
└─────────────────────────────────────────────┘
```

---

## 🧪 Testing

### Probar autenticación:

```bash
# 1. Login y obtener token
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Respuesta incluirá:
# {"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...","usuario":{...}}

# 2. Usar token en request protegido
curl http://localhost:8080/api/admin/usuarios \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Sin token → Error 401
curl http://localhost:8080/api/admin/usuarios
# Error: "No autorizado - Token requerido"

# 4. Token inválido → Error 401
curl http://localhost:8080/api/admin/usuarios \
  -H "Authorization: Bearer token_falso"
# Error: "No autorizado - Token inválido o expirado"
```

### Verificar en navegador (F12 → Console):

```javascript
// Ver token guardado
console.log(localStorage.getItem('authToken'));

// Decodificar token (solo lectura, NO validación)
const token = localStorage.getItem('authToken');
const base64Url = token.split('.')[1];
const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
const payload = JSON.parse(window.atob(base64));
console.log(payload);
```

---

## ⚠️ Consideraciones Importantes

### Seguridad:

1. **Clave JWT_SECRET**
   - ⚠️ Cambiar en producción
   - ⚠️ Usar cadena larga y aleatoria (mínimo 32 bytes)
   - ⚠️ NUNCA commitear al repositorio
   - ✅ Ya está en .gitignore

2. **HTTPS en producción**
   - ⚠️ Tokens se envían en headers
   - ⚠️ Sin HTTPS pueden ser interceptados
   - ✅ Usar certificado SSL/TLS

3. **Duración del token**
   - Actual: 24 horas
   - Producción: Considerar tiempos más cortos
   - Implementar refresh tokens

4. **Logout**
   - Los tokens JWT no se pueden "revocar"
   - Logout solo limpia localStorage
   - Token sigue válido hasta expirar
   - Solución: Implementar blacklist o reducir duración

### Mejoras futuras:

1. **Refresh Tokens**
   - Token de acceso corto (15 min)
   - Token de refresco largo (7 días)
   - Renovar sin pedir credenciales

2. **Blacklist de tokens**
   - Guardar tokens revocados en Redis
   - Verificar en cada request
   - Para logout inmediato

3. **Rate Limiting**
   - Limitar intentos de login
   - Proteger contra fuerza bruta

4. **Auditoría**
   - Registrar cada login
   - Registrar cada uso de token
   - IP, timestamp, acción

---

## 📝 Migración desde Sistema Anterior

### Lo que cambió:

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Autenticación** | Solo frontend | Frontend + Backend |
| **Token** | No existía | JWT firmado |
| **Validación** | En cada página | En cada API call |
| **Expiración** | Manual | Automática (24h) |
| **Seguridad** | Baja | Alta |

### Retrocompatibilidad:

✅ **SIN cambios para el usuario final**
- Login funciona igual
- Interface igual
- Flujo igual

✅ **Transparente**
- Frontend maneja automáticamente
- Token invisible para el usuario
- Logout limpia todo

---

## 🚀 Despliegue

### Producción:

```bash
# 1. Configurar .env con clave segura
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET" >> .env

# 2. Compilar
cd back
go build -o visor-pdf

# 3. Ejecutar
./visor-pdf

# 4. Verificar logs
# ✅ Configuración cargada desde variables de entorno
# ✅ Conectado a MySQL correctamente
# 🚀 Servidor corriendo en http://localhost:8080
```

---

## ✅ Checklist de Seguridad

- [x] JWT implementado
- [x] Tokens firmados con HS256
- [x] Expiración configurada (24h)
- [x] Middleware de autenticación activo
- [x] Middleware de admin activo
- [x] Frontend envía tokens
- [x] Logout limpia tokens
- [x] JWT_SECRET en variables de entorno
- [ ] HTTPS en producción
- [ ] Clave JWT larga y aleatoria en prod
- [ ] Rate limiting implementado
- [ ] Refresh tokens implementados
- [ ] Blacklist para logout inmediato
- [ ] Auditoría de accesos

---

## 🎉 Resultado Final

### Estado actual:

✅ **Autenticación real funcionando**
- JWT generado en login
- Token validado en cada request
- Rol de usuario verificado
- Expiración automática

✅ **Seguridad mejorada**
- Endpoints protegidos
- Tokens imposibles de falsificar
- Validación criptográfica
- Control de acceso por rol

✅ **Listo para desarrollo**
- Compilación exitosa
- Sin errores
- Documentado completamente

⚠️ **Antes de producción:**
- Cambiar JWT_SECRET
- Habilitar HTTPS
- Implementar rate limiting
- Configurar refresh tokens

---

## 📚 Referencias

- JWT.io - https://jwt.io
- RFC 7519 (JWT Spec) - https://tools.ietf.org/html/rfc7519
- golang-jwt - https://github.com/golang-jwt/jwt

---

**¡Autenticación JWT completamente funcional!** 🔐🎉
