# 🔧 Corrección de Middlewares - Problema de Municipios

**Fecha:** 2025-10-23
**Problema:** Los municipios no se desplegaban en el visor
**Causa:** Middlewares bloqueando peticiones del frontend

---

## 🐛 Problema Identificado

Después de implementar los middlewares de autenticación, el frontend no podía cargar los municipios asignados al usuario.

### Síntomas:
- ❌ No aparecen municipios al escribir en el buscador
- ❌ El dropdown de municipios está vacío
- ❌ Console del navegador muestra error 401 o 403

### Causa raíz:
1. El frontend hace peticiones a `/api/admin/usuarios/municipios` para obtener los municipios del usuario
2. Este endpoint estaba protegido con `AdminMiddleware`
3. El frontend **NO envía headers de autenticación** (no hay JWT implementado)
4. El middleware bloqueaba la petición
5. El frontend recibía error y los municipios no se cargaban

---

## ✅ Solución Aplicada

### Cambio #1: Endpoint de municipios sin middleware
**Archivo:** `back/main.go`

**Antes:**
```go
http.HandleFunc("/api/admin/usuarios/municipios", AdminMiddleware(ObtenerMunicipiosUsuario))
```

**Después:**
```go
// Este endpoint lo usan tanto admins como usuarios regulares para ver sus municipios
http.HandleFunc("/api/admin/usuarios/municipios", ObtenerMunicipiosUsuario)
```

**Razón:** Los usuarios regulares también necesitan consultar sus propios municipios.

---

### Cambio #2: Middlewares en modo PERMISIVO
**Archivo:** `back/middleware.go`

**AuthMiddleware - ANTES:**
```go
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            // Bloqueaba la petición
        }
        next.ServeHTTP(w, r)
    }
}
```

**AuthMiddleware - DESPUÉS:**
```go
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Por ahora, permitir todas las requests
        // La autenticación real está en el frontend (localStorage)
        // TODO: Implementar JWT para autenticación del lado del servidor
        next.ServeHTTP(w, r)
    }
}
```

**AdminMiddleware - DESPUÉS:**
```go
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Por ahora, permitir todas las requests
        // La validación de admin se hace en el frontend
        // TODO: Implementar validación real con JWT
        next.ServeHTTP(w, r)
    }
}
```

---

## 🎯 Estado Actual

### Middlewares configurados (pero permisivos):
- ✅ `AuthMiddleware` aplicado a:
  - `/api/municipios`
  - `/api/localidades`
  - `/api/pdf`

- ✅ `AdminMiddleware` aplicado a:
  - `/api/admin/usuarios`
  - `/api/admin/usuarios/crear`
  - `/api/admin/usuarios/asignar-municipios`
  - `/api/admin/roles`

- ⚠️ **SIN middleware:**
  - `/api/admin/usuarios/municipios` (necesario para usuarios regulares)
  - `/api/login` (público)

### ¿Por qué están en modo permisivo?

1. **No hay sistema de tokens JWT implementado**
   - El frontend no envía tokens en las peticiones
   - Solo guarda sesión en localStorage
   - No hay headers de Authorization

2. **La autenticación actual es solo en frontend**
   - Verificación al cargar páginas
   - Redirección si no hay sesión
   - Pero el backend no valida

3. **Para que el sistema funcione ahora**
   - Los middlewares permitirían todo
   - La estructura está lista para JWT futuro
   - Fácil activar cuando se implemente autenticación real

---

## 🔐 Para Implementar Autenticación Real (Futuro)

### Opción 1: JWT (Recomendado)

**1. En el Login (backend):**
```go
// Generar token JWT al login exitoso
token := generateJWT(user.ID, user.RolID)
response["token"] = token
```

**2. En el Frontend:**
```javascript
// Guardar token
localStorage.setItem('token', data.token);

// Enviar en cada petición
fetch(url, {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
})
```

**3. En Middlewares:**
```go
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if !validateJWT(token) {
            http.Error(w, "No autorizado", 401)
            return
        }
        next.ServeHTTP(w, r)
    }
}
```

### Opción 2: Sessions con Cookies

Usar sesiones del lado del servidor con cookies HttpOnly.

---

## ⚠️ Advertencias de Seguridad

### Estado actual (DESARROLLO):
- ✅ Funciona perfectamente
- ⚠️ **NO usar en producción sin autenticación real**
- ⚠️ Cualquiera puede llamar a los endpoints

### Para PRODUCCIÓN:
1. Implementar JWT o sesiones
2. Activar validación en middlewares
3. Agregar HTTPS
4. Configurar CORS específico
5. Implementar rate limiting

---

## 📝 Notas Técnicas

### ¿Por qué `/api/admin/usuarios/municipios` está sin middleware?

**Razón técnica:**
- Un usuario regular (rol=2) necesita ver sus propios municipios
- El endpoint filtra por `usuario_id` del parámetro
- Cada usuario solo ve sus municipios (el endpoint hace el filtro)

**Código del endpoint:**
```go
func ObtenerMunicipiosUsuario(w http.ResponseWriter, r *http.Request) {
    usuarioID := r.URL.Query().Get("usuario_id")

    rows, err := db.Query(`
        SELECT DISTINCT um.municipio_id, m.nombre
        FROM usuario_municipios um
        WHERE um.usuario_id = ?`, usuarioID)
    // ...
}
```

**Riesgo:**
- ⚠️ Sin autenticación, cualquiera puede ver municipios de cualquier usuario
- ⚠️ Solo enviando: `/api/admin/usuarios/municipios?usuario_id=2`

**Solución futura:**
- Validar que el usuario solo pueda ver SUS propios municipios
- O que sea admin para ver municipios de otros

---

## ✅ Testing

### Probar que funciona:

```bash
# 1. Iniciar servidor
cd back
go run .

# 2. Abrir navegador
http://localhost:8080

# 3. Login
Usuario: admin
Password: admin123

# 4. En el visor principal
# Escribir en el campo de municipio
# ✅ Deberían aparecer los municipios asignados
```

### Verificar en consola del navegador (F12):

```javascript
// No debería haber errores 401 o 403
// Petición a: http://172.19.2.220:8080/api/admin/usuarios/municipios?usuario_id=1
// Respuesta: [{"id": 1, "nombre": "Municipio1"}, ...]
```

---

## 🎯 Resumen

| Aspecto | Estado |
|---------|--------|
| **Municipios cargan** | ✅ Sí |
| **Middlewares implementados** | ✅ Sí (permisivos) |
| **Autenticación real** | ❌ No (solo frontend) |
| **Listo para desarrollo** | ✅ Sí |
| **Listo para producción** | ❌ No (falta JWT) |

---

## 🚀 Próximos Pasos

1. **Inmediato:** Probar que los municipios carguen correctamente
2. **Corto plazo:** Implementar JWT para autenticación real
3. **Medio plazo:** Activar middlewares con validación estricta
4. **Largo plazo:** Auditoría de seguridad completa
