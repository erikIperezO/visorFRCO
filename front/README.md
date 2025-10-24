# 🎨 Frontend - Visor de PDFs

Interfaz de usuario del sistema de visualización de actas del Registro Civil de Oaxaca. Aplicación de una sola página (SPA) construida con **JavaScript vanilla** (sin frameworks).

---

## 📁 Estructura

```
front/
├── public/                 # Páginas HTML
│   ├── login.html         # Página de login
│   ├── index.html         # Visor principal (usuarios)
│   └── admin.html         # Panel de administración
├── css/                   # Estilos
│   └── styles.css         # Estilos globales
├── js/                    # JavaScript
│   ├── login.js           # Lógica de login
│   ├── script.js          # Visor principal
│   └── admin.js           # Panel admin
└── assets/                # Recursos estáticos
    └── images/
        └── fondo.png      # Imagen de fondo
```

---

## 🚀 Uso

### Desarrollo Local

El frontend se sirve desde el backend Go. Inicia el servidor backend:

```bash
cd ../back
go run .
```

Luego accede a:
- **Login**: http://localhost:8080/
- **Visor**: http://localhost:8080/front/public/index.html
- **Admin**: http://localhost:8080/front/public/admin.html

### Credenciales por Defecto

```
Usuario: admin
Contraseña: admin123
```

---

## 🔧 Configuración

### API Base URL

El frontend apunta al backend en:

```javascript
// En front/js/script.js línea 1
const API_BASE = "http://172.19.2.220:8080/api";
```

**Cambiar para tu entorno:**
```javascript
const API_BASE = "http://localhost:8080/api";  // Desarrollo local
const API_BASE = "http://tu-servidor:8080/api";  // Producción
```

---

## 📄 Páginas

### 1. Login (`public/login.html`)

Punto de entrada del sistema. Autentica usuarios y redirige según rol.

**Funcionalidades:**
- Validación de credenciales
- Almacenamiento de sesión en `localStorage`
- Redirección basada en rol:
  - **Admin (rol=1)** → `/front/public/admin.html`
  - **Usuario (rol=2)** → `/front/public/index.html`

**Script:** `js/login.js`

### 2. Visor Principal (`public/index.html`)

Interfaz para buscar y visualizar PDFs.

**Funcionalidades:**
- Búsqueda por: municipio, localidad, año, oficialía, número de acta
- Visor de PDF con:
  - Renderizado por tiles (alta resolución)
  - Zoom in/out
  - Pan (arrastrar para navegar)
  - Navegación entre páginas
- Filtros dinámicos (solo municipios asignados al usuario)

**Script:** `js/script.js`

### 3. Panel Admin (`public/admin.html`)

Panel de administración para gestionar usuarios y asignaciones.

**Funcionalidades:**
- **Gestión de usuarios:**
  - Crear nuevos usuarios
  - Listar usuarios existentes
  - Filtrar por nombre o rol
- **Asignación de municipios:**
  - Buscar usuario (autocomplete)
  - Seleccionar múltiples municipios
  - Guardar asignaciones

**Script:** `js/admin.js`

---

## 🎨 Estilos

### Variables CSS (`css/styles.css`)

```css
:root {
  --primary: #005f73;      /* Azul principal */
  --secondary: #0a9396;    /* Azul secundario */
  --success: #2a9d8f;      /* Verde éxito */
  --error: #e76f51;        /* Rojo error */
  --dark: #001219;         /* Texto oscuro */
  --light: #f1faee;        /* Fondo claro */
}
```

### Responsive Design

- **Desktop**: > 1024px (layout completo)
- **Tablet**: 768px - 1024px (layout adaptado)
- **Mobile**: < 768px (layout vertical)

---

## 🔐 Autenticación

### Flujo de Sesión

1. **Login** → POST `/api/login`
2. **Guardar token** → `localStorage.setItem('userSession', data)`
3. **Verificación** → Cada página verifica sesión al cargar
4. **Logout** → `localStorage.removeItem('userSession')`

### Estructura de Sesión

```javascript
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "rol_id": 1,
    "rol_nombre": "admin"
  },
  "municipios": [
    {"id": 1, "nombre": "Oaxaca de Juárez"},
    {"id": 2, "nombre": "Santa Cruz Xoxocotlán"}
  ]
}
```

---

## 📡 Integración con API

### Headers

```javascript
fetch(`${API_BASE}/endpoint`, {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
})
```

### Endpoints Usados

| Endpoint | Usado en | Descripción |
|----------|----------|-------------|
| `POST /api/login` | login.js | Autenticación |
| `GET /api/municipios` | script.js | Lista municipios |
| `GET /api/localidades` | script.js | Lista localidades |
| `GET /api/pdf/render/*` | script.js | Renderizar PDF |
| `GET /api/admin/users` | admin.js | Listar usuarios |
| `POST /api/admin/users` | admin.js | Crear usuario |
| `GET /api/admin/users/{id}/municipios` | admin.js | Municipios asignados |
| `POST /api/admin/assign` | admin.js | Asignar municipios |

---

## 🖼️ Visor de PDF

### Sistema de Tiles

El visor NO usa PDF.js. En su lugar, el backend convierte páginas PDF en imágenes tiles vía microservicio Python.

**Proceso:**
1. Usuario busca acta
2. Frontend solicita: `GET /api/pdf/render?params...`
3. Backend construye ruta del PDF
4. Backend llama al microservicio Python (puerto 5000)
5. Microservicio retorna imagen PNG en base64
6. Frontend renderiza imagen

### Zoom y Pan

```javascript
// Zoom in
zoom += 0.1;
viewer.style.transform = `scale(${zoom})`;

// Pan (arrastrar)
viewer.style.left = `${posX}px`;
viewer.style.top = `${posY}px`;
```

---

## 🧩 Componentes

### Autocomplete de Municipios

En `public/index.html`:

```javascript
// Filtrar municipios al escribir
const query = input.value.toLowerCase();
const filtered = municipios.filter(m =>
  m.nombre.toLowerCase().includes(query)
);
// Mostrar dropdown
```

### Autocomplete de Usuarios (Admin)

En `public/admin.html`:

```javascript
// Buscar usuarios mientras escribes
input.addEventListener('input', async (e) => {
  const usuarios = await fetchUsuarios();
  const filtered = usuarios.filter(u =>
    u.username.toLowerCase().includes(e.target.value.toLowerCase())
  );
  showAutocomplete(filtered);
});
```

### Notificaciones

```javascript
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification');
  notification.textContent = message;
  notification.className = `notification ${type}`;
  notification.classList.add('show');

  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}
```

---

## 🔧 Personalización

### Cambiar Colores

Edita `css/styles.css`:

```css
:root {
  --primary: #TU_COLOR_AQUI;
  --secondary: #TU_COLOR_AQUI;
}
```

### Cambiar Logo

Reemplaza `assets/images/fondo.png` con tu imagen.

### Modificar Formulario

Agrega campos en `public/index.html`:

```html
<div class="form-group">
  <label for="nuevoInput">Nuevo Campo</label>
  <input type="text" id="nuevoInput">
</div>
```

Captura valor en `js/script.js`:

```javascript
const nuevoValor = document.getElementById('nuevoInput').value;
```

---

## 🐛 Debugging

### Consola del Navegador

Abre DevTools (F12) y revisa:
- **Console**: Errores de JavaScript
- **Network**: Peticiones HTTP
- **Application > Local Storage**: Datos de sesión

### Errores Comunes

**"No autorizado"**
- Verifica que el token esté en `localStorage`
- Revisa que el backend esté corriendo

**"Municipios no cargan"**
- Verifica URL del API_BASE
- Revisa permisos CORS en backend
- Confirma asignaciones en base de datos

**"PDF no se muestra"**
- Verifica que el microservicio Python esté corriendo
- Revisa ruta del PDF en backend
- Confirma estructura de directorios de PDFs

---

## ⚡ Optimización

### Reducir Tamaño de Imágenes

```bash
# Optimizar fondo.png
pngquant assets/images/fondo.png --output assets/images/fondo-opt.png
```

### Minificar CSS/JS (Producción)

```bash
# Instalar UglifyJS y CleanCSS
npm install -g uglify-js clean-css-cli

# Minificar
uglifyjs js/script.js -o js/script.min.js
cleancss css/styles.css -o css/styles.min.css
```

Actualiza HTML:
```html
<link rel="stylesheet" href="../css/styles.min.css">
<script src="../js/script.min.js"></script>
```

---

## 🧪 Testing

### Manual

1. **Login**
   - ✅ Probar credenciales correctas
   - ✅ Probar credenciales incorrectas
   - ✅ Verificar redirección por rol

2. **Visor**
   - ✅ Buscar acta válida
   - ✅ Buscar acta inexistente
   - ✅ Probar zoom in/out
   - ✅ Probar navegación de páginas

3. **Admin**
   - ✅ Crear usuario
   - ✅ Asignar municipios
   - ✅ Filtrar usuarios

### Automatizado (TODO)

```javascript
// Ejemplo con Jest
test('Login exitoso redirige a visor', async () => {
  const response = await login('admin', 'admin123');
  expect(response.token).toBeDefined();
  expect(window.location.href).toContain('/front/public/index.html');
});
```

---

## 📦 Despliegue

### Servir desde Backend

El backend Go sirve los archivos estáticos:

```go
// En main.go
fs := http.FileServer(http.Dir("./front"))
http.Handle("/front/", http.StripPrefix("/front/", fs))
```

### Servidor Web Independiente (Nginx)

```nginx
server {
  listen 80;
  server_name tu-dominio.com;

  root /var/www/visorPDFs/front;
  index public/login.html;

  location /api {
    proxy_pass http://localhost:8080;
  }

  location / {
    try_files $uri $uri/ =404;
  }
}
```

---

## 🔗 Referencias

- [MDN Web Docs](https://developer.mozilla.org/)
- [JavaScript.info](https://javascript.info/)
- [CSS Tricks](https://css-tricks.com/)
- Ver `/docs/` para documentación completa del proyecto
