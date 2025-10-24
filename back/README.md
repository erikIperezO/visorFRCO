# 🔧 Backend - Go REST API

Backend del sistema de visualización de PDFs del Registro Civil de Oaxaca. API RESTful construida en Go que maneja autenticación JWT, acceso a base de datos y proxy al microservicio de procesamiento de PDFs.

---

## 📁 Estructura

```
back/
├── cmd/                    # Puntos de entrada
│   ├── server/
│   │   └── main.go        # Servidor principal
│   └── tools/
│       └── generar_hash.go # Generador de hashes bcrypt
│
├── internal/               # Código interno (no importable fuera)
│   ├── config/
│   │   └── config.go      # Configuración (.env y config.json)
│   ├── database/
│   │   └── database.go    # Conexión a BD con pool
│   ├── models/
│   │   └── models.go      # Estructuras de datos
│   ├── auth/
│   │   ├── auth.go        # Handler de login
│   │   ├── jwt.go         # Generación/validación JWT
│   │   └── middleware.go  # Middlewares de autenticación
│   └── handlers/
│       ├── admin.go       # Gestión de usuarios
│       ├── municipios.go  # Endpoints de municipios/localidades
│       └── pdf.go         # Proxy al microservicio PDF
│
├── build/                  # Binarios compilados (gitignored)
├── go.mod                  # Definición de módulo Go
├── go.sum                  # Checksums de dependencias
├── .env.example            # Plantilla de variables de entorno
├── config.json.example     # Plantilla de configuración
└── README.md               # Esta documentación
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Go** 1.19 o superior
- **MariaDB/MySQL** corriendo en localhost
- Base de datos `digitalizacion` creada (ver `/database/`)

### 1. Configuración

#### Opción A: Variables de entorno (recomendado)

```bash
# Copiar plantilla
cp .env.example .env

# Editar con tus credenciales
nano .env
```

Ejemplo `.env`:
```env
PDF_BASE_PATH=E:/decadas
DB_USER=digitalizacion
DB_PASSWORD=tu_password_aqui
DB_HOST=localhost
DB_PORT=3306
DB_NAME=digitalizacion
JWT_SECRET=tu_clave_jwt_super_secreta_aleatoria
```

#### Opción B: Archivo JSON

```bash
# Copiar plantilla
cp config.json.example config.json

# Editar con tus credenciales
nano config.json
```

### 2. Instalar Dependencias

```bash
go mod download
```

### 3. Ejecutar

```bash
# Modo desarrollo (desde cmd/server/)
cd cmd/server
go run .

# O desde la raíz del proyecto back/
go run cmd/server/main.go

# Escucharás en: http://localhost:8080
```

### 4. Compilar

```bash
# Desde cmd/server/
cd cmd/server

# Windows
go build -o ../../build/visor-pdf.exe

# Linux/macOS
go build -o ../../build/visor-pdf

# Ejecutar binario
cd ../../build
./visor-pdf.exe  # Windows
./visor-pdf      # Linux/macOS
```

---

## 📦 Dependencias

```
github.com/go-sql-driver/mysql  # Driver MySQL
golang.org/x/crypto/bcrypt      # Hash de contraseñas
github.com/joho/godotenv        # Variables de entorno
```

### Agregar dependencias

```bash
go get github.com/nueva-dependencia
go mod tidy
```

---

## 🔑 Autenticación

El sistema usa **JWT (JSON Web Tokens)** para autenticación.

### Login

```bash
POST /api/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Respuesta:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "rol_id": 1,
    "rol_nombre": "admin"
  },
  "municipios": [...]
}
```

### Usar Token

```bash
GET /api/municipios
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📡 Endpoints

### Públicos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `POST` | `/api/login` | Autenticación de usuario |

### Protegidos (requieren JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/municipios` | Listar municipios |
| `GET` | `/api/localidades?municipio_id={id}` | Listar localidades |
| `GET` | `/api/pdf/render/*` | Proxy a microservicio PDF |

### Admin (requieren rol admin)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/admin/users` | Listar usuarios |
| `POST` | `/api/admin/users` | Crear usuario |
| `GET` | `/api/admin/users/{id}/municipios` | Municipios de usuario |
| `POST` | `/api/admin/assign` | Asignar municipios |
| `GET` | `/api/admin/roles` | Listar roles |

Ver documentación completa en `/docs/api/`

---

## 🗂️ Archivos Principales

### Punto de Entrada

- **`cmd/server/main.go`** - Servidor HTTP, definición de rutas, CORS

### Configuración y Base de Datos

- **`internal/config/config.go`** - Carga de configuración (.env o config.json)
- **`internal/database/database.go`** - Conexión a BD con pool de conexiones
- **`internal/models/models.go`** - Estructuras de datos (Usuario, Municipio, etc.)

### Autenticación

- **`internal/auth/auth.go`** - Handler de login, validación de credenciales
- **`internal/auth/jwt.go`** - Generación y validación de tokens JWT
- **`internal/auth/middleware.go`** - Middlewares de autenticación (AuthMiddleware, AdminMiddleware)

### Handlers

- **`internal/handlers/pdf.go`** - Proxy al microservicio de PDFs
- **`internal/handlers/admin.go`** - Gestión de usuarios y asignaciones de municipios
- **`internal/handlers/municipios.go`** - Endpoints de municipios y localidades

### Utilidades

- **`cmd/tools/generar_hash.go`** - Generador de hashes bcrypt para contraseñas (CLI)

---

## 🔐 Generar Hash de Contraseña

Para crear nuevos usuarios con contraseñas hasheadas:

```bash
# Editar cmd/tools/generar_hash.go con la contraseña deseada
go run cmd/tools/generar_hash.go

# Output: $2a$10$...
# Copiar hash a INSERT INTO usuarios
```

---

## 🗄️ Configuración de Base de Datos

### Pool de Conexiones

```go
MaxOpenConns: 25
MaxIdleConns: 10
ConnMaxLifetime: 5 minutos
```

### DSN

```
usuario:password@tcp(host:port)/database?parseTime=true
```

`parseTime=true` es crítico para manejo correcto de DATE/DATETIME.

---

## 🛠️ Desarrollo

### Estructura Actual (Siguiendo Best Practices de Go)

✅ **Ya implementada** - El proyecto sigue la estructura estándar de Go con:

- `cmd/` - Puntos de entrada (ejecutables)
- `internal/` - Código interno organizado por paquetes
- `build/` - Binarios compilados (gitignored)

Esta estructura facilita:
- Separación clara de responsabilidades
- Reutilización de código
- Testing independiente por paquete
- Escalabilidad del proyecto

### Hot Reload (Opcional)

```bash
# Instalar Air
go install github.com/cosmtrek/air@latest

# Ejecutar con hot reload
air
```

---

## 🐛 Debugging

### Habilitar Logs Detallados

```go
// En main.go
import "log"

log.SetFlags(log.LstdFlags | log.Lshortfile)
log.Println("Debug message")
```

### Probar Endpoints con cURL

```bash
# Login
curl -X POST http://localhost:8080/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Usar token
TOKEN="eyJhbGciOi..."
curl http://localhost:8080/api/municipios \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ Seguridad

### En Desarrollo

- ✅ Middlewares implementados (permisivos)
- ✅ JWT implementado
- ✅ Bcrypt para contraseñas
- ⚠️ CORS permisivo (`Access-Control-Allow-Origin: *`)

### Para Producción

1. **Variables de entorno**: Usar `.env` en lugar de `config.json`
2. **JWT Secret**: Generar clave aleatoria fuerte
3. **CORS**: Restringir a dominios específicos
4. **HTTPS**: Configurar TLS/SSL
5. **Rate Limiting**: Limitar peticiones por IP
6. **Logs**: Implementar logging estructurado

---

## 🧪 Testing

### Preparando Tests (TODO)

```bash
# Ejecutar tests
go test ./...

# Con coverage
go test -cover ./...

# Tests específicos
go test -v ./auth_test.go
```

---

## 📊 Performance

### Benchmarking

```bash
# Benchmark de funciones
go test -bench=. -benchmem

# Profiling CPU
go test -cpuprofile=cpu.prof
go tool pprof cpu.prof
```

### Optimizaciones Aplicadas

- ✅ Pool de conexiones DB configurado
- ✅ Caché de consultas frecuentes (TODO)
- ✅ Compresión gzip en respuestas (TODO)

---

## 🔗 Referencias

- [Go Documentation](https://golang.org/doc/)
- [go-sql-driver/mysql](https://github.com/go-sql-driver/mysql)
- [JWT en Go](https://golang-jwt.github.io/jwt/)
- Ver `/docs/` para documentación completa del proyecto
