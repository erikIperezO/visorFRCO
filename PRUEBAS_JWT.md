# 🧪 Pruebas de Autenticación JWT

## Pre-requisitos

1. **Ejecutar migración de BD:**
```bash
mysql -u digitalizacion -pqwerty25 digitalizacion < migracion_simple.sql
```

2. **Insertar datos iniciales:**
```bash
mysql -u digitalizacion -pqwerty25 digitalizacion < datos_iniciales.sql
```

3. **Servidor corriendo:**
```bash
cd back
go run .
```

---

## ✅ Prueba 1: Login y Obtener Token

### Request:
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

### Respuesta esperada:
```json
{
  "municipios_permitidos": [],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJ1c2VybmFtZSI6ImFkbWluIiwicm9sX2lkIjoxLCJyb2xfbmFtZSI6ImFkbWluIiwiZXhwIjoxNzMwMDAwMDAwLCJpYXQiOjE3Mjk5MTM2MDAsIm5iZiI6MTcyOTkxMzYwMCwiaXNzIjoidmlzb3ItcGRmLWFwaSJ9.SIGNATURE",
  "usuario": {
    "id": 1,
    "username": "admin",
    "activo": true,
    "rol_id": 1,
    "rol_nombre": "admin"
  }
}
```

### Verificación:
- ✅ Token presente
- ✅ Usuario con datos correctos
- ✅ Rol = admin

---

## ✅ Prueba 2: Endpoint Protegido CON Token

### Guardar token en variable:
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Request:
```bash
curl http://localhost:8080/api/admin/usuarios \
  -H "Authorization: Bearer $TOKEN"
```

### Respuesta esperada:
```json
[
  {
    "id": 1,
    "username": "admin",
    "activo": true,
    "rol_id": 1,
    "rol_nombre": "admin"
  }
]
```

### Verificación:
- ✅ Status 200
- ✅ Lista de usuarios retornada
- ✅ Token aceptado

---

## ❌ Prueba 3: Endpoint Protegido SIN Token

### Request:
```bash
curl http://localhost:8080/api/admin/usuarios
```

### Respuesta esperada:
```
No autorizado - Token requerido
```

### Verificación:
- ✅ Status 401
- ✅ Mensaje de error
- ✅ Acceso bloqueado

---

## ❌ Prueba 4: Token Inválido

### Request:
```bash
curl http://localhost:8080/api/admin/usuarios \
  -H "Authorization: Bearer token_falso_123"
```

### Respuesta esperada:
```
No autorizado - Token inválido o expirado
```

### Verificación:
- ✅ Status 401
- ✅ Token rechazado

---

## ❌ Prueba 5: Usuario Regular en Endpoint Admin

### Crear usuario regular:
```bash
curl -X POST http://localhost:8080/api/admin/usuarios/crear \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"username\":\"usuario1\",\"password\":\"pass123\",\"rol_id\":2}"
```

### Login como usuario regular:
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"usuario1\",\"password\":\"pass123\"}"
```

### Intentar acceder a endpoint admin:
```bash
curl http://localhost:8080/api/admin/usuarios \
  -H "Authorization: Bearer $USER_TOKEN"
```

### Respuesta esperada:
```
Acceso denegado - Solo administradores
```

### Verificación:
- ✅ Status 403
- ✅ Rol validado correctamente

---

## ✅ Prueba 6: Endpoints Públicos

### Request (sin token):
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

### Verificación:
- ✅ Login funciona sin token previo
- ✅ Endpoint público accesible

---

## ✅ Prueba 7: Decodificar Token JWT

### En navegador (F12 → Console):
```javascript
const token = localStorage.getItem('authToken');
if (token) {
  const parts = token.split('.');
  const payload = JSON.parse(atob(parts[1]));
  console.log('Datos del token:', payload);
  console.log('Expira:', new Date(payload.exp * 1000));
  console.log('Usuario:', payload.username);
  console.log('Rol:', payload.rol_name);
}
```

### Salida esperada:
```javascript
{
  user_id: 1,
  username: "admin",
  rol_id: 1,
  rol_name: "admin",
  exp: 1730000000,
  iat: 1729913600,
  nbf: 1729913600,
  iss: "visor-pdf-api"
}
```

---

## ✅ Prueba 8: Flujo Completo en Navegador

### Pasos:

1. **Limpiar localStorage:**
```javascript
localStorage.clear();
```

2. **Abrir login:**
```
http://localhost:8080
```

3. **Hacer login:**
   - Usuario: admin
   - Password: admin123

4. **Verificar token guardado:**
```javascript
console.log('Token:', localStorage.getItem('authToken'));
console.log('Session:', localStorage.getItem('userSession'));
```

5. **Navegar al visor:**
   - ✅ Municipios cargan correctamente
   - ✅ Sin errores en console

6. **Abrir panel admin (si eres admin):**
```
http://localhost:8080/front/admin.html
```
   - ✅ Usuarios cargan correctamente
   - ✅ Roles cargan correctamente

7. **Hacer logout:**
   - Click en "Cerrar Sesión"
   - ✅ Redirige a login
   - ✅ Token eliminado

8. **Intentar acceder sin login:**
```
http://localhost:8080/front/index.html
```
   - ✅ Redirige a login automáticamente

---

## 🔍 Verificación de Seguridad

### ✅ Checklist:

- [ ] Login genera token JWT
- [ ] Token se guarda en localStorage
- [ ] Endpoints protegidos requieren token
- [ ] Endpoints sin token retornan 401
- [ ] Tokens inválidos retornan 401
- [ ] AdminMiddleware valida rol
- [ ] Usuario regular no accede a admin
- [ ] Logout elimina token
- [ ] Token expira en 24 horas
- [ ] Navegador envía token automáticamente

---

## 🛠️ Debugging

### Ver logs del servidor:
```bash
# Si está en background
cat back/server.log

# O reiniciar en foreground
cd back
go run .
```

### Ver requests en console del navegador:
```
F12 → Network → Ver headers de requests
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Verificar errores:
```
F12 → Console
```

---

## 📊 Resultados Esperados

| Prueba | Endpoint | Con Token | Sin Token | Rol User | Rol Admin |
|--------|----------|-----------|-----------|----------|-----------|
| Login | /api/login | N/A | ✅ 200 | N/A | N/A |
| Municipios | /api/municipios | ✅ 200 | ❌ 401 | ✅ 200 | ✅ 200 |
| Localidades | /api/localidades | ✅ 200 | ❌ 401 | ✅ 200 | ✅ 200 |
| PDF | /api/pdf | ✅ 200 | ❌ 401 | ✅ 200 | ✅ 200 |
| Listar Users | /api/admin/usuarios | ✅ 200 | ❌ 401 | ❌ 403 | ✅ 200 |
| Crear User | /api/admin/usuarios/crear | ✅ 200 | ❌ 401 | ❌ 403 | ✅ 200 |
| Asignar Muni | /api/admin/usuarios/asignar | ✅ 200 | ❌ 401 | ❌ 403 | ✅ 200 |

---

## 🎯 Comandos Rápidos

### Preparar todo:
```bash
# 1. BD
mysql -u digitalizacion -pqwerty25 digitalizacion < migracion_simple.sql
mysql -u digitalizacion -pqwerty25 digitalizacion < datos_iniciales.sql

# 2. Servidor
cd back
go run .

# 3. Navegador
http://localhost:8080
```

### Login rápido:
```bash
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d @test_login.json
```

### Guardar token:
```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d @test_login.json | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "Token guardado: $TOKEN"
```

### Usar token:
```bash
curl http://localhost:8080/api/admin/usuarios \
  -H "Authorization: Bearer $TOKEN"
```

---

¡Sistema JWT listo para pruebas! 🔐
