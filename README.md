# Visor de Actas - Registro Civil Oaxaca

Sistema de visualización de actas digitalizadas del Registro Civil con autenticación y control de acceso basado en roles.

## Características

- 🔐 **Autenticación segura** con bcrypt
- 👥 **Roles de usuario** (Admin y Usuario regular)
- 🗺️ **Control de acceso** por municipios asignados
- 📄 **Visualización de PDFs** con sistema de tiles para rendimiento óptimo
- 🔍 **Búsqueda avanzada** por municipio, localidad, año y número de acta
- ⚙️ **Panel de administración** para gestión de usuarios

## Arquitectura

- **Backend**: Go (puerto 8080)
- **Microservicio PDF**: Python/Flask (puerto 5000)
- **Frontend**: JavaScript vanilla
- **Base de datos**: MariaDB

## Configuración Inicial

### 1. Base de Datos

Ejecuta los scripts SQL en orden:

```bash
# 1. Crear estructura de base de datos
mysql -u root -p < digitalizacion.sql

# 2. Insertar datos iniciales (roles y usuario admin)
mysql -u root -p < datos_iniciales.sql
```

Esto creará un usuario admin por defecto:
- **Usuario**: `admin`
- **Contraseña**: `admin123`

### 2. Configurar Backend

Edita `back/config.json` con tus credenciales:

```json
{
  "pdfBasePath": "E:/decadas",
  "dbUser": "digitalizacion",
  "dbPassword": "tu_password",
  "dbHost": "localhost",
  "dbPort": "3306",
  "dbName": "digitalizacion"
}
```

### 3. Configurar Frontend

Edita el `API_BASE` en los siguientes archivos con la IP de tu servidor:

- `front/script.js` (línea 1)
- `front/login.js` (línea 1)
- `front/admin.js` (línea 5)

```javascript
const API_BASE = "http://TU_IP:8080/api";
```

## Ejecución

### 1. Iniciar el Backend (Go)

```bash
cd back
go run .
```

El servidor estará en `http://localhost:8080`

### 2. Iniciar el Microservicio PDF (Python)

```bash
cd microservice
python pdf_service.py
```

Requiere PyMuPDF: `pip install PyMuPDF Flask`

### 3. Acceder al Sistema

Abre tu navegador en `http://localhost:8080` (o la IP configurada)

## Flujo de Autenticación

1. **Login** (`/`): Todos los usuarios comienzan aquí
2. Backend valida credenciales y consulta municipios asignados
3. **Usuario Admin**: Redirige a `/front/admin.html`
4. **Usuario Regular**: Redirige a `/front/index.html`
5. Sesión guardada en `localStorage`
6. Verificación automática en cada página

**Importante**: Los municipios se asignan de forma permanente a los usuarios, sin restricción por fechas.

## Panel de Administración

Solo accesible por usuarios con rol `admin`. Permite:

- ✅ Crear nuevos usuarios
- ✅ Asignar roles (admin/usuario)
- ✅ Asignar municipios permitidos por usuario (asignación permanente)
- ✅ Ver lista de todos los usuarios

## Generar Nuevas Contraseñas

Para crear hashes de contraseñas para nuevos usuarios:

```bash
cd back
go run generar_hash.go
```

Edita el archivo para cambiar la contraseña que deseas hashear.

## Estructura de PDFs

Los archivos PDF deben estar organizados así:

```
{pdfBasePath}/
  └── decada {YYYY}/
      └── {acto}/
          └── {año}/
              └── {municipio}/
                  └── {oficialia}/
                      └── {localidad}/
                          └── {filename}.pdf
```

Ejemplo: `E:/decadas/decada 2010/1/2015/020/01/003/1202001201500005003.pdf`

### Formato del nombre de archivo:
`{acto}{estado}{municipio}{oficialia}{año}{numActa}{localidad}0.pdf`

- `acto`: 1 dígito
- `estado`: Siempre "20"
- `municipio`: 3 dígitos (con ceros a la izquierda)
- `oficialia`: 2 dígitos (con ceros a la izquierda)
- `año`: 4 dígitos
- `numActa`: 5 dígitos (con ceros a la izquierda)
- `localidad`: 3 dígitos (con ceros a la izquierda)
- Sufijo: Siempre "0"

## Roles y Permisos

### Rol Admin (rol_id = 1)
- Acceso al panel de administración
- Crear y gestionar usuarios
- Asignar municipios a usuarios
- Acceso al visor de actas

### Rol Usuario (rol_id = 2)
- Acceso solo al visor de actas
- Solo puede buscar en municipios asignados
- Sin acceso al panel de administración

## Seguridad

- ✅ Contraseñas hasheadas con bcrypt (cost 10)
- ✅ Verificación de sesión en cada página
- ✅ Validación de roles en frontend y backend
- ✅ CORS habilitado para desarrollo
- ⚠️ **PRODUCCIÓN**: Configurar CORS específico y usar HTTPS

## Desarrollo

### Compilar Backend

```bash
cd back
go build -o visor-pdf.exe
```

### Estructura de Archivos

```
visorPDFs/
├── back/               # Backend Go
│   ├── main.go
│   ├── auth.go         # Autenticación
│   ├── admin.go        # Endpoints admin
│   ├── pdf.go          # Manejo de PDFs
│   ├── config.json
│   └── generar_hash.go
├── front/              # Frontend
│   ├── login.html
│   ├── login.js
│   ├── index.html      # Visor principal
│   ├── script.js
│   ├── admin.html      # Panel admin
│   └── admin.js
├── microservice/       # Servicio Python
│   └── pdf_service.py
├── digitalizacion.sql  # Schema DB
└── datos_iniciales.sql # Datos iniciales
```

## Solución de Problemas

### No puedo iniciar sesión
- Verifica que ejecutaste `datos_iniciales.sql`
- Revisa las credenciales en la consola del navegador (F12)
- Verifica que el backend esté corriendo

### Error "Archivo no encontrado"
- Verifica `pdfBasePath` en `config.json`
- Confirma que la estructura de carpetas y nombres de archivo sean correctos

### Microservicio no responde
- Asegúrate de que Python Flask esté en puerto 5000
- Instala dependencias: `pip install PyMuPDF Flask`

### Usuario no admin no puede acceder
- Verifica que el usuario tenga municipios asignados
- Usa el panel admin para asignar municipios

## Contacto y Soporte

Para problemas o sugerencias, contacta al equipo de desarrollo.
