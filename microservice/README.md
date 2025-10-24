# 🐍 Microservicio PDF - Python Flask

Microservicio para convertir páginas PDF en imágenes tiled de alta resolución usando PyMuPDF (fitz). Funciona como servicio independiente al que el backend Go hace proxy.

---

## 📁 Estructura

```
microservice/
├── pdf_service.py       # Servicio Flask principal
├── requirements.txt     # Dependencias Python
├── .env.example         # Plantilla de configuración
└── README.md           # Esta documentación
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Python** 3.8 o superior
- **pip** (gestor de paquetes Python)

### 1. Crear Entorno Virtual (Recomendado)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

### 2. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 3. Configuración (Opcional)

```bash
# Copiar plantilla
cp .env.example .env

# Editar configuración
nano .env
```

### 4. Ejecutar

```bash
python pdf_service.py

# Servicio corriendo en: http://localhost:5000
```

---

## 📦 Dependencias

### `requirements.txt`

```
Flask==3.0.0
PyMuPDF==1.23.8
```

### Descripción

- **Flask**: Framework web ligero para Python
- **PyMuPDF (fitz)**: Librería para manipulación de PDFs

### Actualizar Dependencias

```bash
# Actualizar todas
pip install --upgrade -r requirements.txt

# Actualizar una específica
pip install --upgrade PyMuPDF
```

---

## 📡 API

### Endpoint Principal

```
GET /render-pdf
```

**Parámetros Query:**

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `filePath` | string | Ruta absoluta del PDF | `E:/decadas/file.pdf` |
| `page` | int | Número de página (base 1) | `1` |
| `dpi` | int | Resolución en DPI | `200` |

**Ejemplo de Petición:**

```bash
curl "http://localhost:5000/render-pdf?filePath=E:/decadas/test.pdf&page=1&dpi=200"
```

**Respuesta Exitosa:**

```json
{
  "success": true,
  "image": "iVBORw0KGgoAAAANSUhEUgAAA...",
  "width": 1200,
  "height": 1600,
  "total_pages": 3
}
```

**Respuesta de Error:**

```json
{
  "success": false,
  "error": "Archivo no encontrado"
}
```

---

## 🔧 Configuración

### Variables de Entorno

Crea un archivo `.env`:

```env
# Puerto del servicio
PORT=5000

# Host (0.0.0.0 para acceso externo, 127.0.0.1 para local)
HOST=127.0.0.1

# Modo debug (True/False)
DEBUG=False

# DPI por defecto
DEFAULT_DPI=200
```

### Cargar en `pdf_service.py`

```python
import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv('PORT', 5000))
HOST = os.getenv('HOST', '127.0.0.1')
DEBUG = os.getenv('DEBUG', 'False') == 'True'
```

---

## 🖼️ Cómo Funciona

### 1. Recepción de Petición

```python
@app.route('/render-pdf')
def render_pdf():
    file_path = request.args.get('filePath')
    page_num = int(request.args.get('page', 1))
    dpi = int(request.args.get('dpi', 200))
```

### 2. Abrir PDF

```python
doc = fitz.open(file_path)
total_pages = doc.page_count
page = doc[page_num - 1]  # PyMuPDF usa índice base 0
```

### 3. Renderizar a Imagen

```python
# Matriz de transformación para DPI
mat = fitz.Matrix(dpi / 72, dpi / 72)

# Renderizar página como imagen
pix = page.get_pixmap(matrix=mat, alpha=False)
```

### 4. Convertir a PNG Base64

```python
import base64
from io import BytesIO

# Convertir a bytes PNG
img_bytes = pix.tobytes("png")

# Codificar en base64
img_base64 = base64.b64encode(img_bytes).decode('utf-8')
```

### 5. Retornar JSON

```python
return jsonify({
    "success": True,
    "image": img_base64,
    "width": pix.width,
    "height": pix.height,
    "total_pages": total_pages
})
```

---

## 🔐 Seguridad

### Validación de Rutas

⚠️ **IMPORTANTE**: Valida que las rutas de archivos sean seguras.

```python
import os

def is_safe_path(path):
    # Prevenir path traversal
    if '..' in path or '~' in path:
        return False

    # Verificar que existe
    if not os.path.exists(path):
        return False

    return True

# Uso
if not is_safe_path(file_path):
    return jsonify({"success": False, "error": "Ruta inválida"}), 400
```

### CORS

Habilita CORS solo para dominios confiables:

```python
from flask_cors import CORS

# Opción 1: Permitir todos (desarrollo)
CORS(app)

# Opción 2: Restringir dominios (producción)
CORS(app, origins=["http://localhost:8080", "https://tu-dominio.com"])
```

### Rate Limiting

```python
from flask_limiter import Limiter

limiter = Limiter(
    app=app,
    key_func=lambda: request.remote_addr,
    default_limits=["100 per hour"]
)

@app.route('/render-pdf')
@limiter.limit("10 per minute")
def render_pdf():
    ...
```

---

## 🐛 Debugging

### Logs Detallados

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.route('/render-pdf')
def render_pdf():
    logger.debug(f"Renderizando: {file_path}, página {page_num}")
    ...
```

### Errores Comunes

**"ModuleNotFoundError: No module named 'fitz'"**

```bash
pip install PyMuPDF
```

**"FileNotFoundError: [Errno 2] No such file or directory"**

- Verifica que la ruta del PDF sea correcta
- Usa rutas absolutas, no relativas

**"Error: MuPDF error: cannot open document"**

- Archivo PDF corrupto o protegido con contraseña
- Verifica permisos de lectura del archivo

---

## ⚡ Optimización

### 1. Caché de PDFs

```python
from functools import lru_cache

@lru_cache(maxsize=100)
def open_pdf(file_path):
    return fitz.open(file_path)
```

### 2. Compresión de Imágenes

```python
# Reducir calidad para menor tamaño
pix = page.get_pixmap(matrix=mat, alpha=False)
img_bytes = pix.tobytes("jpeg", quality=85)  # JPEG con calidad 85%
```

### 3. Workers Concurrentes

```bash
# Usar Gunicorn en producción
pip install gunicorn

# Ejecutar con 4 workers
gunicorn -w 4 -b 0.0.0.0:5000 pdf_service:app
```

---

## 🧪 Testing

### Manual

```bash
# Test básico
curl "http://localhost:5000/render-pdf?filePath=C:/test.pdf&page=1&dpi=150"

# Verificar respuesta
# Debe retornar JSON con "success": true
```

### Automatizado con pytest

```python
# tests/test_pdf_service.py
import pytest
from pdf_service import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_render_pdf_success(client):
    response = client.get('/render-pdf?filePath=test.pdf&page=1&dpi=200')
    data = response.get_json()
    assert data['success'] == True
    assert 'image' in data
```

Ejecutar:
```bash
pytest tests/
```

---

## 📊 Monitoreo

### Métricas Básicas

```python
from flask import request
from time import time

@app.before_request
def before_request():
    request.start_time = time()

@app.after_request
def after_request(response):
    duration = time() - request.start_time
    logger.info(f"{request.method} {request.path} - {response.status_code} - {duration:.2f}s")
    return response
```

### Health Check

```python
@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "version": "1.0.0"
    })
```

---

## 🚀 Despliegue

### Opción 1: Systemd (Linux)

Crear `/etc/systemd/system/pdf-service.service`:

```ini
[Unit]
Description=PDF Rendering Service
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/visorPDFs/microservice
Environment="PATH=/var/www/visorPDFs/microservice/venv/bin"
ExecStart=/var/www/visorPDFs/microservice/venv/bin/python pdf_service.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Habilitar:
```bash
sudo systemctl enable pdf-service
sudo systemctl start pdf-service
```

### Opción 2: Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY pdf_service.py .

EXPOSE 5000

CMD ["python", "pdf_service.py"]
```

Construir y ejecutar:
```bash
docker build -t pdf-microservice .
docker run -p 5000:5000 pdf-microservice
```

### Opción 3: Gunicorn (Producción)

```bash
# Instalar
pip install gunicorn

# Ejecutar
gunicorn -w 4 -b 0.0.0.0:5000 --timeout 120 pdf_service:app
```

---

## 🔗 Integración con Backend Go

El backend Go hace proxy a este servicio:

```go
// En back/pdf.go
func GetPDFAsImage(w http.ResponseWriter, r *http.Request) {
    // Construir URL del microservicio
    microserviceURL := "http://localhost:5000/render-pdf"

    // Hacer petición
    resp, err := http.Get(microserviceURL + "?filePath=" + pdfPath)

    // Reenviar respuesta al frontend
    io.Copy(w, resp.Body)
}
```

---

## 📚 Referencias

- [PyMuPDF Documentation](https://pymupdf.readthedocs.io/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Python Official Docs](https://docs.python.org/3/)
- Ver `/docs/` para documentación completa del proyecto
