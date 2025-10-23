# 🔥 Correcciones Urgentes - Acción Inmediata

## Problema #1: Sistema de Fechas Roto (CRÍTICO)

**Estado actual:** 🔴 Los usuarios no pueden ver municipios al día siguiente de ser asignados

### Solución A: Eliminar el filtro por fecha (Más simple)

**Modificar `back/auth.go` línea 42-48:**

```go
// ANTES (ROTO):
hoy := time.Now().Format("2006-01-02")
rows, err := db.Query(`
    SELECT um.municipio_id, m.nombre
    FROM usuario_municipios um
    JOIN municipios m ON um.municipio_id = m.idmunicipios
    WHERE um.usuario_id = ? AND um.fecha_asignacion = ?`,
    user.ID, hoy)

// DESPUÉS (ARREGLADO):
rows, err := db.Query(`
    SELECT DISTINCT um.municipio_id, m.nombre
    FROM usuario_municipios um
    JOIN municipios m ON um.municipio_id = m.idmunicipios
    WHERE um.usuario_id = ?`,
    user.ID)
```

**Modificar `back/admin.go` línea 85-87 para incluir fecha:**

```go
// ANTES:
_, err := db.Exec(
    "INSERT INTO usuario_municipios (usuario_id, municipio_id) VALUES (?, ?)",
    asignacion.UsuarioID, municipioID)

// DESPUÉS:
_, err := db.Exec(
    "INSERT INTO usuario_municipios (usuario_id, municipio_id, fecha_asignacion) VALUES (?, ?, CURDATE())",
    asignacion.UsuarioID, municipioID)
```

### Solución B: Implementar rango de fechas (Más robusto)

**1. Modificar esquema de BD:**

```sql
ALTER TABLE usuario_municipios
  MODIFY COLUMN fecha_asignacion DATE NOT NULL,
  ADD COLUMN fecha_fin DATE DEFAULT '9999-12-31';

-- Actualizar registros existentes
UPDATE usuario_municipios
SET fecha_asignacion = CURDATE(),
    fecha_fin = '9999-12-31'
WHERE fecha_asignacion IS NULL;
```

**2. Modificar `back/auth.go`:**

```go
hoy := time.Now().Format("2006-01-02")
rows, err := db.Query(`
    SELECT um.municipio_id, m.nombre
    FROM usuario_municipios um
    JOIN municipios m ON um.municipio_id = m.idmunicipios
    WHERE um.usuario_id = ?
      AND ? BETWEEN um.fecha_asignacion AND um.fecha_fin`,
    user.ID, hoy)
```

---

## Problema #2: Endpoints Sin Protección (CRÍTICO)

### Implementar Middlewares

**Modificar `back/middleware.go` completo:**

```go
package main

import (
    "net/http"
    "strings"
)

// AuthMiddleware - Verifica que haya sesión válida
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // En producción: verificar JWT o token de sesión
        // Por ahora: verificar header básico o implementar JWT

        // Ejemplo básico (MEJORAR en producción):
        authHeader := r.Header.Get("Authorization")
        if authHeader == "" {
            http.Error(w, "No autorizado", http.StatusUnauthorized)
            return
        }

        // Aquí validarías el token JWT
        // Por ahora pasamos
        next.ServeHTTP(w, r)
    }
}

// AdminMiddleware - Verifica que sea admin
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        // Extraer rol del token/sesión
        // Por ahora verificar header

        role := r.Header.Get("X-User-Role")
        if role != "admin" && role != "1" {
            http.Error(w, "Acceso denegado - Solo administradores", http.StatusForbidden)
            return
        }

        next.ServeHTTP(w, r)
    }
}
```

**Modificar `back/main.go` líneas 29-33:**

```go
// ANTES:
http.HandleFunc("/api/admin/usuarios", ListarUsuarios)
http.HandleFunc("/api/admin/usuarios/crear", CrearUsuario)
http.HandleFunc("/api/admin/usuarios/asignar-municipios", AsignarMunicipiosUsuario)
http.HandleFunc("/api/admin/usuarios/municipios", ObtenerMunicipiosUsuario)
http.HandleFunc("/api/admin/roles", ObtenerRoles)

// DESPUÉS:
http.HandleFunc("/api/admin/usuarios", AdminMiddleware(ListarUsuarios))
http.HandleFunc("/api/admin/usuarios/crear", AdminMiddleware(CrearUsuario))
http.HandleFunc("/api/admin/usuarios/asignar-municipios", AdminMiddleware(AsignarMunicipiosUsuario))
http.HandleFunc("/api/admin/usuarios/municipios", AdminMiddleware(ObtenerMunicipiosUsuario))
http.HandleFunc("/api/admin/roles", AdminMiddleware(ObtenerRoles))

// Proteger también endpoints de PDF
http.HandleFunc("/api/pdf", AuthMiddleware(GetPDFAsImage))
http.HandleFunc("/api/municipios", AuthMiddleware(GetMunicipios))
http.HandleFunc("/api/localidades", AuthMiddleware(GetLocalidades))
```

---

## Problema #3: Config.json No Se Encuentra

**Modificar `back/config.go` línea 19:**

```go
// ANTES:
file, err := os.Open("config.json")

// DESPUÉS:
configPath := "back/config.json"
if _, err := os.Stat(configPath); os.IsNotExist(err) {
    // Si no existe, buscar en directorio actual (cuando se ejecuta desde back/)
    configPath = "config.json"
}
file, err := os.Open(configPath)
```

---

## Problema #4: Pool de Conexiones DB

**Modificar `back/database.go` después de la línea 26:**

```go
func ConnectDB(cfg Config) {
    var err error
    dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
        cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
    db, err = sql.Open("mysql", dsn)
    if err != nil {
        log.Fatalf("Error conectando a la BD: %v", err)
    }

    // AGREGAR ESTAS LÍNEAS:
    db.SetMaxOpenConns(25)
    db.SetMaxIdleConns(10)
    db.SetConnMaxLifetime(5 * time.Minute)

    if err = db.Ping(); err != nil {
        log.Fatalf("No se pudo hacer ping a la BD: %v", err)
    }

    fmt.Println("✅ Conectado a MySQL correctamente")
}
```

**Agregar import al inicio del archivo:**
```go
import (
    "database/sql"
    "fmt"
    "log"
    "time"  // AGREGAR
    _ "github.com/go-sql-driver/mysql"
)
```

---

## Problema #5: Variables de Entorno

**Crear archivo `.env` (NO commitear):**

```env
PDF_BASE_PATH=E:/decadas
DB_USER=digitalizacion
DB_PASSWORD=qwerty25
DB_HOST=localhost
DB_PORT=3306
DB_NAME=digitalizacion
```

**Instalar godotenv:**

```bash
cd back
go get github.com/joho/godotenv
```

**Modificar `back/config.go`:**

```go
package main

import (
    "encoding/json"
    "os"
    "github.com/joho/godotenv"
)

type Config struct {
    PDFBasePath string
    DBUser      string
    DBPassword  string
    DBHost      string
    DBPort      string
    DBName      string
}

func LoadConfig() (Config, error) {
    // Cargar .env si existe
    _ = godotenv.Load(".env")

    config := Config{
        PDFBasePath: getEnv("PDF_BASE_PATH", "E:/decadas"),
        DBUser:      getEnv("DB_USER", "digitalizacion"),
        DBPassword:  getEnv("DB_PASSWORD", ""),
        DBHost:      getEnv("DB_HOST", "localhost"),
        DBPort:      getEnv("DB_PORT", "3306"),
        DBName:      getEnv("DB_NAME", "digitalizacion"),
    }

    // Fallback a config.json si no hay variables de entorno
    if config.DBPassword == "" {
        file, err := os.Open("back/config.json")
        if err != nil {
            file, err = os.Open("config.json")
            if err != nil {
                return config, err
            }
        }
        defer file.Close()
        err = json.NewDecoder(file).Decode(&config)
        return config, err
    }

    return config, nil
}

func getEnv(key, defaultValue string) string {
    value := os.Getenv(key)
    if value == "" {
        return defaultValue
    }
    return value
}
```

**Agregar a `.gitignore`:**

```
.env
back/.env
back/config.json
```

---

## Script de Corrección Rápida

**Crear archivo `arreglar_fechas.sql`:**

```sql
USE digitalizacion;

-- Arreglar asignaciones sin fecha
UPDATE usuario_municipios
SET fecha_asignacion = CURDATE()
WHERE fecha_asignacion IS NULL;

-- Verificar
SELECT
    u.username,
    m.nombre AS municipio,
    um.fecha_asignacion
FROM usuario_municipios um
JOIN usuarios u ON um.usuario_id = u.id
JOIN municipios m ON um.municipio_id = m.idmunicipios
ORDER BY u.username, m.nombre;
```

---

## Orden de Aplicación

1. **PRIMERO:** Arreglar fechas en BD
   ```bash
   mysql -u digitalizacion -p digitalizacion < arreglar_fechas.sql
   ```

2. **SEGUNDO:** Aplicar correcciones al código Go
   - Modificar `auth.go` (quitar filtro por fecha exacta)
   - Modificar `admin.go` (agregar fecha_asignacion)
   - Modificar `database.go` (pool de conexiones)
   - Modificar `config.go` (buscar config.json correctamente)

3. **TERCERO:** Recompilar y probar
   ```bash
   cd back
   go build
   ./visor-pdf.exe
   ```

4. **CUARTO:** Implementar middlewares (puede esperar un poco)

5. **QUINTO:** Variables de entorno (antes de producción)

---

## Testing Rápido

Después de aplicar correcciones, probar:

```bash
# Test 1: Login funciona
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test 2: Crear usuario (sin middleware primero)
curl -X POST http://localhost:8080/api/admin/usuarios/crear \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123","rol_id":2}'

# Test 3: Asignar municipio
curl -X POST http://localhost:8080/api/admin/usuarios/asignar-municipios \
  -H "Content-Type: application/json" \
  -d '{"usuario_id":2,"municipios_ids":[1,2]}'

# Test 4: Ver municipios del usuario
curl "http://localhost:8080/api/admin/usuarios/municipios?usuario_id=2"
```
