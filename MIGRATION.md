# 📦 Guía de Migración a Nueva Estructura

Este documento explica los cambios en la estructura del proyecto y cómo migrar desde la versión anterior.

---

## 🗂️ Cambios en la Estructura

### Antes → Después

```
visorPDFs/                               visorPDFs/
├── 9 archivos .md dispersos        →   ├── README.md
├── 5 archivos .sql dispersos            ├── CLAUDE.md
├── back/                                ├── MIGRATION.md
│   ├── *.go                             │
│   ├── .env (EN GIT ❌)           →     ├── docs/
│   ├── config.json (EN GIT ❌)          │   ├── setup/
│   └── visor-pdf.exe (EN GIT ❌)        │   ├── authentication/
│                                        │   ├── history/
├── front/                               │   ├── audits/
│   ├── *.html                           │   └── api/
│   ├── *.js                             │
│   ├── *.css                            ├── database/
│   └── fondo.png                        │   ├── schema.sql
│                                        │   ├── seeds/
└── microservice/                        │   └── migrations/
    └── pdf_service.py                   │
                                         ├── back/
                                         │   ├── README.md
                                         │   ├── *.go
                                         │   ├── .env.example
                                         │   ├── config.json.example
                                         │   ├── cmd/
                                         │   └── build/
                                         │
                                         ├── front/
                                         │   ├── README.md
                                         │   ├── public/
                                         │   │   ├── login.html
                                         │   │   ├── index.html
                                         │   │   └── admin.html
                                         │   ├── css/
                                         │   │   └── styles.css
                                         │   ├── js/
                                         │   │   ├── login.js
                                         │   │   ├── script.js
                                         │   │   └── admin.js
                                         │   └── assets/
                                         │       └── images/
                                         │           └── fondo.png
                                         │
                                         └── microservice/
                                             ├── README.md
                                             ├── requirements.txt
                                             ├── .env.example
                                             └── pdf_service.py
```

---

## 🚨 Cambios Críticos que Requieren Acción

### 1. ⚠️ Archivos de Configuración Removidos de Git

**Problema:** Los archivos `.env` y `config.json` con credenciales fueron removidos del repositorio.

**Solución:**

```bash
# ANTES de hacer git pull, respaldar tus archivos locales
cp back/.env back/.env.backup
cp back/config.json back/config.json.backup

# Hacer git pull
git pull origin master

# Copiar plantillas y restaurar credenciales
cp back/.env.example back/.env
cp back/config.json.example back/config.json

# Editar con tus credenciales reales
# (usa las de .backup como referencia)
nano back/.env
nano back/config.json
```

### 2. 🗂️ Frontend Reestructurado

**Cambio:** Los archivos HTML, CSS y JS se movieron a subdirectorios.

**Rutas antiguas:**
```
front/login.html
front/index.html
front/admin.html
front/styles.css
front/login.js
front/script.js
front/admin.js
front/fondo.png
```

**Rutas nuevas:**
```
front/public/login.html
front/public/index.html
front/public/admin.html
front/css/styles.css
front/js/login.js
front/js/script.js
front/js/admin.js
front/assets/images/fondo.png
```

**Acción requerida:**
- ✅ Referencias ya actualizadas en archivos HTML y JS
- ✅ Servidor backend ya sirve desde rutas nuevas
- ⚠️ Si tienes bookmarks, actualizarlos a `/front/public/login.html`

### 3. 📚 Documentación Reorganizada

**Cambio:** 9 archivos .md consolidados en `docs/`

**Mapeo:**

| Archivo Antiguo | Nueva Ubicación |
|----------------|-----------------|
| `AUTENTICACION_JWT.md` | `docs/authentication/jwt-guide.md` |
| `PRUEBAS_JWT.md` | `docs/authentication/testing.md` |
| `AUDITORIA.md` | `docs/audits/audit-log.md` |
| `CAMBIOS_SIN_FECHAS.md` | `docs/history/changes.md` |
| `CORRECCIONES_*.md` (3 archivos) | `docs/history/corrections.md` (consolidado) |

### 4. 🗄️ Base de Datos Reorganizada

**Cambio:** Archivos SQL movidos a `database/`

**Mapeo:**

| Archivo Antiguo | Nueva Ubicación |
|----------------|-----------------|
| `digitalizacion.sql` | `database/schema.sql` |
| `datos_iniciales.sql` | `database/seeds/initial_data.sql` |
| `migracion_simple.sql` | `database/migrations/001_simple.sql` |
| `migracion_sin_fechas.sql` | `database/migrations/002_remove_dates.sql` |
| `arreglar_fechas.sql` | `database/migrations/003_fix_dates.sql` |

---

## 📋 Pasos para Migrar (Desarrolladores Existentes)

### Paso 1: Respaldar Configuración Local

```bash
# Respaldar archivos sensibles
cp back/.env ~/backup/.env.backup
cp back/config.json ~/backup/config.json.backup
```

### Paso 2: Actualizar desde Git

```bash
# Asegurarse de estar en master
git checkout master

# Traer cambios
git pull origin master
```

### Paso 3: Restaurar Configuración

```bash
# Copiar plantillas
cp back/.env.example back/.env
cp back/config.json.example back/config.json

# Editar con credenciales del backup
nano back/.env
nano back/config.json
```

### Paso 4: Verificar .gitignore

```bash
# Confirmar que archivos sensibles están ignorados
git status

# NO deben aparecer:
# - back/.env
# - back/config.json
# - back/build/
# - back/visor-pdf.exe
```

### Paso 5: Actualizar Microservicio (si aplica)

```bash
cd microservice

# Instalar nuevas dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
nano .env
```

### Paso 6: Probar Todo

```bash
# 1. Backend
cd back
go run .

# 2. Microservicio (nueva terminal)
cd microservice
python pdf_service.py

# 3. Frontend (abrir navegador)
http://localhost:8080/front/public/login.html
```

---

## 🆕 Setup para Nuevos Desarrolladores

### Paso 1: Clonar Repositorio

```bash
git clone <url-del-repo> visorPDFs
cd visorPDFs
```

### Paso 2: Configurar Base de Datos

```bash
# Crear estructura
mysql -u root -p < database/schema.sql

# Insertar datos iniciales
mysql -u root -p < database/seeds/initial_data.sql

# Aplicar migraciones (en orden)
mysql -u digitalizacion -p digitalizacion < database/migrations/001_simple.sql
mysql -u digitalizacion -p digitalizacion < database/migrations/002_remove_dates.sql
mysql -u digitalizacion -p digitalizacion < database/migrations/003_fix_dates.sql
```

### Paso 3: Configurar Backend

```bash
cd back

# Copiar plantillas
cp .env.example .env
cp config.json.example config.json

# Editar con credenciales
nano .env

# Instalar dependencias
go mod download

# Ejecutar
go run .
```

### Paso 4: Configurar Microservicio

```bash
cd microservice

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Instalar dependencias
pip install -r requirements.txt

# Copiar plantilla
cp .env.example .env

# Ejecutar
python pdf_service.py
```

### Paso 5: Acceder al Sistema

```
URL: http://localhost:8080/front/public/login.html
Usuario: admin
Contraseña: admin123
```

---

## 🔍 Verificación Post-Migración

### Checklist

- [ ] Backend inicia sin errores
  ```bash
  cd back && go run .
  # Debe mostrar: "🚀 Servidor corriendo en http://localhost:8080"
  ```

- [ ] Microservicio inicia sin errores
  ```bash
  cd microservice && python pdf_service.py
  # Debe mostrar: "Running on http://127.0.0.1:5000"
  ```

- [ ] Login funciona
  ```bash
  curl -X POST http://localhost:8080/api/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"admin123"}'
  # Debe retornar token JWT
  ```

- [ ] Frontend carga correctamente
  - Abrir: http://localhost:8080/front/public/login.html
  - Login con admin/admin123
  - Ver lista de municipios
  - Buscar y renderizar PDF

- [ ] Archivos sensibles NO están en git
  ```bash
  git status
  # NO debe mostrar .env, config.json, *.exe
  ```

---

## 🐛 Problemas Comunes

### Error: "No such file or directory: config.json"

**Causa:** No copiaste las plantillas de configuración

**Solución:**
```bash
cd back
cp .env.example .env
cp config.json.example config.json
# Editar con credenciales reales
```

### Error: "cannot open front/login.html"

**Causa:** Ruta antigua hardcoded en algún archivo

**Solución:**
- Nueva ruta: `front/public/login.html`
- Verificar referencias en `back/main.go`

### Error: "ModuleNotFoundError: No module named 'fitz'"

**Causa:** Dependencias del microservicio no instaladas

**Solución:**
```bash
cd microservice
pip install -r requirements.txt
```

### Frontend muestra "404 Not Found" en CSS/JS

**Causa:** Referencias a rutas antiguas

**Solución:** Ya está corregido en el código. Si persiste:
```html
<!-- Verificar en HTML -->
<link rel="stylesheet" href="../css/styles.css">
<script src="../js/script.js"></script>
```

---

## 📊 Resumen de Beneficios

### Antes de la Migración

- ❌ Credenciales en Git (riesgo de seguridad)
- ❌ Binario de 11MB en repositorio
- ❌ 9 archivos .md dispersos (difícil de navegar)
- ❌ 5 archivos SQL sin organización
- ❌ Sin READMEs en componentes
- ❌ Microservicio sin documentación

### Después de la Migración

- ✅ **Seguridad**: Credenciales solo locales (.gitignore)
- ✅ **Tamaño repo**: Reducción de 18.5MB a ~3.5MB (78% menos)
- ✅ **Documentación**: Organizada en `docs/` por categorías
- ✅ **Base de datos**: Migraciones numeradas y semillas separadas
- ✅ **README**: Cada componente tiene su guía
- ✅ **Microservicio**: requirements.txt y .env.example
- ✅ **Frontend**: Estructura escalable (public/, css/, js/, assets/)
- ✅ **Backend**: Directorios cmd/ y build/ para futuro crecimiento

---

## 📞 Soporte

Si encuentras problemas durante la migración:

1. **Revisar esta guía** - Probablemente esté documentado aquí
2. **Revisar logs** - Backend y microservicio muestran errores detallados
3. **Verificar .gitignore** - Asegurar que archivos sensibles estén ignorados
4. **Consultar READMEs** - Cada componente tiene su documentación

---

## 🎯 Próximos Pasos (Opcional)

### Mejoras Futuras

1. **Reestructuración completa de Go**
   - Mover a `cmd/server/main.go`
   - Crear paquetes en `internal/`
   - Requiere actualizar imports

2. **Dockerización**
   - Crear Dockerfiles para cada servicio
   - docker-compose.yml para orquestación

3. **CI/CD**
   - GitHub Actions para tests automáticos
   - Deploy automático en merge a master

4. **Tests automatizados**
   - Tests unitarios en Go
   - Tests de integración
   - Tests E2E con Playwright/Cypress

---

**Última actualización:** 2025-10-24
**Versión:** 2.0.0
