# 🔍 Auditoría Completa del Proyecto - Visor de PDFs

**Fecha:** 2025-10-23
**Total de líneas de código:** ~3,351

---

## 🚨 PROBLEMAS CRÍTICOS DE SEGURIDAD

### 1. ❌ **Middlewares No Implementados**
**Archivo:** `back/middleware.go`
**Severidad:** CRÍTICA

**Problema:**
- Los middlewares `AuthMiddleware` y `AdminMiddleware` están definidos pero **NUNCA se usan**
- Los endpoints de admin NO están protegidos en el backend
- Cualquiera puede llamar a los endpoints sin autenticación

**Archivos afectados:**
```
back/main.go - líneas 29-33 (endpoints admin sin protección)
```

**Impacto:**
- ❌ Cualquiera puede crear usuarios
- ❌ Cualquiera puede asignar municipios
- ❌ Cualquiera puede listar usuarios
- ❌ NO hay validación de sesión en backend

**Solución requerida:** Implementar middlewares en todos los endpoints protegidos

---

### 2. ⚠️ **Fecha de Asignación Problemática**
**Archivo:** `back/auth.go`, `back/admin.go`
**Severidad:** ALTA

**Problema:**
- El sistema filtra municipios por **fecha exacta** (línea 42 de auth.go)
- Si hoy es 23/10/2025, el usuario SOLO ve municipios asignados para esa fecha específica
- Mañana NO verá nada a menos que se reasigne

**Código problemático:**
```go
// back/auth.go:42
hoy := time.Now().Format("2006-01-02")
rows, err := db.Query(`
    SELECT um.municipio_id, m.nombre
    FROM usuario_municipios um
    JOIN municipios m ON um.municipio_id = m.idmunicipios
    WHERE um.usuario_id = ? AND um.fecha_asignacion = ?`,
    user.ID, hoy)
```

**Solución sugerida:**
- Cambiar lógica a fecha de inicio (fecha_desde) y fecha fin (fecha_hasta)
- O eliminar el filtro por fecha y usar solo usuario_id → municipio_id

---

### 3. ⚠️ **Sin Protección CSRF**
**Severidad:** MEDIA

**Problema:**
- No hay tokens CSRF en formularios
- CORS está en `*` (permitir todo)

**Archivo:** `back/main.go:58`
```go
w.Header().Set("Access-Control-Allow-Origin", "*")
```

**Riesgo:** Ataques CSRF desde cualquier origen

---

### 4. ⚠️ **Contraseñas en Configuración**
**Archivo:** `back/config.json`
**Severidad:** MEDIA

**Problema:**
- Credenciales de BD están en texto plano en un archivo JSON
- El archivo está en el repositorio

**Solución:** Usar variables de entorno

---

## 🐛 BUGS FUNCIONALES

### 5. ⚠️ **AsignarMunicipios Sin Fecha**
**Archivo:** `back/admin.go:65-93`
**Severidad:** ALTA

**Problema:**
- Cuando se asignan municipios en el admin, NO se especifica `fecha_asignacion`
- La columna `fecha_asignacion` puede quedar NULL
- Luego el login falla porque busca por fecha exacta

**Código problemático:**
```go
// back/admin.go:85-87
_, err := db.Exec(
    "INSERT INTO usuario_municipios (usuario_id, municipio_id) VALUES (?, ?)",
    asignacion.UsuarioID, municipioID)
```

Debería ser:
```go
INSERT INTO usuario_municipios (usuario_id, municipio_id, fecha_asignacion)
VALUES (?, ?, CURDATE())
```

---

### 6. ❌ **Config.json No Se Encuentra**
**Archivo:** `back/config.go:19`
**Severidad:** MEDIA

**Problema:**
- El código busca `config.json` en el directorio actual
- Cuando ejecutas desde la raíz del proyecto, NO encuentra el archivo
- Debería buscar en `back/config.json`

**Solución:**
```go
file, err := os.Open("back/config.json")
```

---

### 7. ⚠️ **Sin Pool de Conexiones DB**
**Archivo:** `back/database.go`
**Severidad:** MEDIA

**Problema:**
- No hay configuración de pool de conexiones
- No hay timeouts configurados
- Puede causar problemas bajo carga

**Solución requerida:**
```go
db.SetMaxOpenConns(25)
db.SetMaxIdleConns(10)
db.SetConnMaxLifetime(5 * time.Minute)
```

---

## 📝 FUNCIONALIDADES FALTANTES

### 8. ❌ **No hay Manejo de Sesiones en Backend**
**Severidad:** ALTA

**Problema:**
- La "sesión" solo existe en localStorage del frontend
- Backend no valida tokens
- No hay JWT, cookies de sesión, ni nada

**Impacto:**
- Cualquiera puede falsificar una "sesión" editando localStorage
- No hay expiración de sesión
- No hay logout real en backend

---

### 9. ❌ **Sin Logs de Auditoría**
**Severidad:** MEDIA

**Problema:**
- No se registra quién accede a qué PDFs
- No se registra quién crea usuarios
- No hay trazabilidad

---

### 10. ❌ **Sin Validación de Permisos en Backend**
**Severidad:** CRÍTICA

**Problema:**
- Los endpoints `/api/pdf`, `/api/municipios`, `/api/localidades` NO validan permisos
- Cualquiera puede acceder a cualquier PDF si conoce los parámetros

**Ejemplo de ataque:**
```bash
curl "http://localhost:8080/api/pdf?year=2020&municipio=001&..."
# ✅ Funciona sin autenticación
```

---

## 🎨 PROBLEMAS DE UI/UX

### 11. ⚠️ **Login.html tiene CSS inline**
**Archivo:** `front/login.html:9-175`

**Problema:**
- Todo el CSS está dentro del HTML
- Debería estar en un archivo separado

---

### 12. ℹ️ **Mensajes de Error Poco Claros**
**Archivo:** `back/auth.go:30-31,36`

**Problema:**
```go
http.Error(w, "Credenciales inválidas 1", http.StatusUnauthorized)
http.Error(w, "Credenciales inválidas 2", http.StatusUnauthorized)
```

**Mejora:** Un solo mensaje genérico (seguridad) o mensajes más descriptivos en desarrollo

---

### 13. ℹ️ **Sin Indicador de Carga en Admin**
**Archivo:** `front/admin.js`

**Problema:**
- No hay spinner mientras se cargan usuarios o municipios
- La UI parece congelada

---

## 🔧 MEJORAS DE CÓDIGO

### 14. ℹ️ **Código Duplicado en Redirecciones**
**Archivos:** `front/login.js`, `front/admin.js`, `front/script.js`

**Problema:**
- La lógica de verificación de rol está repetida 3 veces

**Solución:** Crear una función compartida

---

### 15. ℹ️ **Magic Numbers**
**Archivo:** `front/script.js`, varios lugares

**Problema:**
```javascript
if (data.usuario.rol_id === 1)  // ¿Qué es 1?
```

**Mejora:**
```javascript
const ROLES = { ADMIN: 1, USER: 2 };
if (data.usuario.rol_id === ROLES.ADMIN)
```

---

### 16. ℹ️ **Sin Manejo de Errores en Fetch**
**Archivos:** Varios en `front/`

**Problema:**
- Muchos `fetch()` sin `.catch()`
- Errores de red no se manejan adecuadamente

---

## 📊 ESTADÍSTICAS DEL PROYECTO

| Componente | Archivos | Líneas | Estado |
|------------|----------|--------|--------|
| Backend Go | 10 | ~615 | ⚠️ Requiere refactorización |
| Frontend JS | 3 | ~1,528 | ✅ Funcional, mejorable |
| Frontend HTML | 3 | ~1,166 | ⚠️ CSS mezclado |
| SQL | 2 | ~110 | ✅ OK |
| **TOTAL** | **18** | **~3,351** | **⚠️ FUNCIONAL CON RIESGOS** |

---

## 🎯 PRIORIZACIÓN DE CORRECCIONES

### 🔴 **URGENTE (Hacer antes de producción)**
1. Implementar middlewares de autenticación en backend
2. Agregar validación de sesión en endpoints protegidos
3. Corregir asignación de municipios con fecha
4. Proteger endpoints de PDF con validación de permisos
5. Mover credenciales a variables de entorno

### 🟡 **IMPORTANTE (Hacer pronto)**
6. Implementar sistema de sesiones real (JWT o cookies)
7. Agregar pool de conexiones a la DB
8. Corregir búsqueda de config.json
9. Agregar logs de auditoría
10. Mejorar manejo de errores

### 🟢 **MEJORAS (Cuando haya tiempo)**
11. Separar CSS de login.html
12. Refactorizar código duplicado
13. Agregar constantes para magic numbers
14. Mejorar mensajes de error
15. Agregar indicadores de carga
16. Agregar validaciones en formularios

---

## ✅ COSAS QUE ESTÁN BIEN

1. ✅ Uso de bcrypt para contraseñas
2. ✅ Estructura de proyecto clara
3. ✅ Separación de responsabilidades en clases JS
4. ✅ SQL con prepared statements (previene SQL injection)
5. ✅ UI moderna y responsive
6. ✅ Validaciones en frontend
7. ✅ Manejo de zoom y panning en el visor
8. ✅ Sistema de roles implementado
9. ✅ CLAUDE.md y README.md documentados

---

## 📋 CHECKLIST DE SEGURIDAD

- [ ] Implementar autenticación en backend
- [ ] Validar permisos en cada endpoint
- [ ] Usar variables de entorno para secretos
- [ ] Implementar rate limiting
- [ ] Agregar HTTPS en producción
- [ ] Configurar CORS específico (no `*`)
- [ ] Implementar tokens CSRF
- [ ] Agregar headers de seguridad
- [ ] Validar inputs en backend
- [ ] Sanitizar outputs

---

## 🚀 RECOMENDACIONES FINALES

### Para desarrollo inmediato:
1. **Corregir el sistema de fechas** - Es el bug más crítico que afecta usabilidad
2. **Implementar middlewares** - Seguridad básica
3. **Arreglar config.json path** - Para que el servidor arranque correctamente

### Para producción:
1. Implementar JWT o sistema de sesiones robusto
2. Mover a HTTPS
3. Configurar firewall y rate limiting
4. Agregar monitoreo y logs
5. Hacer pruebas de penetración

### Arquitectura a largo plazo:
- Considerar separar el frontend en un servidor diferente
- Agregar Redis para caché de sesiones
- Implementar un API Gateway
- Agregar balanceador de carga
