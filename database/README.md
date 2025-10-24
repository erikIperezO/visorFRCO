# 🗄️ Database Setup

Configuración de la base de datos MariaDB/MySQL para el sistema de visualización de PDFs.

---

## 📋 Estructura de Archivos

```
database/
├── schema.sql              # Esquema completo de la base de datos
├── seeds/
│   └── initial_data.sql    # Datos iniciales (roles y admin)
└── migrations/
    ├── 001_simple.sql      # Migración simple
    ├── 002_remove_dates.sql # Eliminación de filtros por fecha
    └── 003_fix_dates.sql   # Corrección de fechas
```

---

## 🚀 Setup Inicial

### 1. Crear la Base de Datos

```bash
# Crear estructura de tablas
mysql -u root -p < database/schema.sql

# Insertar datos iniciales
mysql -u root -p < database/seeds/initial_data.sql
```

### 2. Credenciales por Defecto

Después de ejecutar los seeds, tendrás:

**Usuario Admin:**
- Username: `admin`
- Password: `admin123`

**Usuario de Base de Datos:**
- Database: `digitalizacion`
- User: `digitalizacion`
- Password: `qwerty25` (configurable en `back/config.json`)

---

## 📊 Esquema de Base de Datos

### Tablas Principales

#### `usuarios`
Cuentas de usuario con contraseñas hasheadas (bcrypt).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único |
| `username` | VARCHAR(50) | Nombre de usuario |
| `password_hash` | VARCHAR(255) | Contraseña bcrypt |
| `rol_id` | INT | FK a `roles` |
| `fecha_creacion` | TIMESTAMP | Fecha de creación |

#### `roles`
Roles del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único |
| `nombre` | VARCHAR(50) | Nombre del rol |

**Roles disponibles:**
- `1` - admin
- `2` - user

#### `municipios`
Catálogo de municipios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `idmunicipios` | INT | ID del municipio |
| `nombre` | VARCHAR(255) | Nombre del municipio |

#### `localidades`
Localidades dentro de municipios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único |
| `nombre` | VARCHAR(255) | Nombre de la localidad |
| `municipio_id` | INT | FK a `municipios` |

#### `usuario_municipios`
Asignación de municipios a usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | INT | ID único |
| `usuario_id` | INT | FK a `usuarios` |
| `municipio_id` | INT | FK a `municipios` |
| `fecha_asignacion` | DATE | Fecha de asignación |

---

## 🔄 Migraciones

### Aplicar Migraciones

```bash
# Migración 1: Cambios simples
mysql -u digitalizacion -p digitalizacion < database/migrations/001_simple.sql

# Migración 2: Remover filtros por fecha
mysql -u digitalizacion -p digitalizacion < database/migrations/002_remove_dates.sql

# Migración 3: Corregir fechas existentes
mysql -u digitalizacion -p digitalizacion < database/migrations/003_fix_dates.sql
```

### Orden de Aplicación

1. **Setup inicial**: `schema.sql` + `seeds/initial_data.sql`
2. **Migraciones**: En orden numérico (001, 002, 003...)

---

## 🔧 Comandos Útiles

### Conectar a la Base de Datos

```bash
mysql -u digitalizacion -p digitalizacion
```

### Verificar Usuarios

```sql
SELECT
    u.id,
    u.username,
    r.nombre AS rol
FROM usuarios u
JOIN roles r ON u.rol_id = r.id;
```

### Verificar Asignaciones

```sql
SELECT
    u.username,
    m.nombre AS municipio,
    um.fecha_asignacion
FROM usuario_municipios um
JOIN usuarios u ON um.usuario_id = u.id
JOIN municipios m ON um.municipio_id = m.idmunicipios
ORDER BY u.username, m.nombre;
```

### Crear Usuario de BD (si no existe)

```sql
-- Crear usuario
CREATE USER 'digitalizacion'@'localhost' IDENTIFIED BY 'qwerty25';

-- Dar permisos
GRANT ALL PRIVILEGES ON digitalizacion.* TO 'digitalizacion'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;
```

---

## 🔐 Seguridad

### Contraseñas

- **NUNCA** uses contraseñas por defecto en producción
- Cambia `admin123` inmediatamente en producción
- Usa contraseñas fuertes para el usuario de BD

### Generar Password Hash

Usa el utilitario del backend:

```bash
cd back
go run cmd/tools/generar_hash.go
```

Edita el archivo para cambiar la contraseña que quieres hashear.

---

## 📝 Notas

### Sistema de Fechas

- **Antes**: Se filtraban municipios por fecha exacta de asignación
- **Ahora**: Las asignaciones son permanentes (sin filtro por fecha)
- La columna `fecha_asignacion` se mantiene para auditoría

### Pool de Conexiones

El backend está configurado con:
- `MaxOpenConns = 25`
- `MaxIdleConns = 10`
- `ConnMaxLifetime = 5 minutos`

---

## 🆘 Troubleshooting

### Error: "Access denied for user"

Verifica:
1. Usuario existe: `SELECT User FROM mysql.user WHERE User='digitalizacion';`
2. Permisos correctos: `SHOW GRANTS FOR 'digitalizacion'@'localhost';`
3. Credenciales en `back/config.json` o `back/.env`

### Error: "Table doesn't exist"

Ejecuta el schema:
```bash
mysql -u root -p < database/schema.sql
```

### No hay usuarios

Ejecuta los seeds:
```bash
mysql -u root -p < database/seeds/initial_data.sql
```

---

## 🔗 Referencias

- Ver `/docs/setup/` para configuración completa
- Ver `/docs/api/` para endpoints que usan estas tablas
- Ver `back/models.go` para estructuras de datos
