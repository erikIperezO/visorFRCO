# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a PDF viewer application for digitalized civil registry documents (actas) from Mexican municipalities. The system allows role-based access where users can search and view PDF documents based on registry data (municipality, locality, year, office number, and document number).

## Architecture

### Three-Tier Architecture

1. **Backend (Go)** - `back/` directory
   - REST API server on port 8080
   - Handles authentication, database queries, and PDF routing
   - Serves static frontend files

2. **Python Microservice** - `microservice/` directory
   - Flask service on port 5000
   - Converts PDF pages into tiled images using PyMuPDF
   - Returns base64-encoded PNG tiles for efficient rendering

3. **Frontend (Vanilla JS)** - `front/` directory
   - Single-page application with three views: login, main viewer, and admin panel
   - No framework dependencies, uses native DOM manipulation
   - Custom tile-based PDF rendering with zoom and pan

### Database Schema

MariaDB database named `digitalizacion` with these key tables:
- `usuarios` - User accounts with bcrypt password hashing
- `roles` - User roles (admin, user)
- `usuario_municipios` - Date-based municipality access assignments
- `municipios` - Municipality catalog
- `localidades` - Localities within municipalities

See `digitalizacion.sql` for complete schema.

## Development Commands

### Initial Setup

```bash
# 1. Create database structure
mysql -u root -p < digitalizacion.sql

# 2. Insert initial data (roles and admin user)
mysql -u root -p < datos_iniciales.sql
```

Default admin credentials:
- Username: `admin`
- Password: `admin123`

### Starting the Backend (Go)

```bash
cd back
go run .
```

Server runs on `http://localhost:8080`

### Starting the PDF Microservice (Python)

```bash
cd microservice
python pdf_service.py
```

Requires PyMuPDF: `pip install PyMuPDF`
Service runs on `http://localhost:5000`

### Building the Backend

```bash
cd back
go build -o visor-pdf.exe
```

### Generating Password Hashes

To create bcrypt hashes for new users:

```bash
cd back
go run generar_hash.go
```

Edit the file to change the password you want to hash.

## Configuration

### Backend Configuration (`back/config.json`)

```json
{
  "pdfBasePath": "E:/decadas",
  "dbUser": "digitalizacion",
  "dbPassword": "qwerty25",
  "dbHost": "localhost",
  "dbPort": "3306",
  "dbName": "digitalizacion"
}
```

**Important**: Credentials are currently hardcoded. Consider using environment variables for production.

### Frontend API Configuration

The API base URL is hardcoded in `front/script.js:1`:
```javascript
const API_BASE = "http://172.19.2.220:8080/api";
```

Change this to match your backend server address.

## PDF File Organization

PDFs are organized in a strict directory hierarchy:
```
{pdfBasePath}/decada {decade}/{acto}/{year}/{municipio}/{oficialia}/{localidad}/{filename}.pdf
```

Example: `E:/decadas/decada 2010/1/2015/020/01/003/1202001201500005003.pdf`

Filename format: `{acto}{estado}{municipio}{oficialia}{year}{numActa}{localidad}0.pdf`
- acto: 1 digit (e.g., "1")
- estado: Always "20"
- municipio: 3 digits zero-padded
- oficialia: 2 digits zero-padded
- year: 4 digits
- numActa: 5 digits zero-padded
- localidad: 3 digits zero-padded
- Suffix: Always "0"

## Key Backend Files

- `main.go` - Server entry point, route definitions, CORS middleware
- `auth.go` - Login endpoint with date-based permission filtering
- `pdf.go` - PDF path resolution and microservice proxy
- `admin.go` - User and municipality assignment management
- `municipios.go` - Municipality and locality data endpoints
- `models.go` - Data structure definitions
- `database.go` - Database connection setup
- `config.go` - Configuration loading

## Key Frontend Files

- `index.html` - Main PDF viewer interface
- `login.html` - Login page
- `admin.html` - Admin panel for user management
- `script.js` - Main viewer logic with tile rendering, zoom, and pan
- `login.js` - Authentication flow
- `admin.js` - User and municipality assignment management
- `styles.css` - Shared styles

## Authentication Flow

1. **Login Page** (`/`): All users start here at `front/login.html`
2. User submits credentials via `/api/login`
3. Backend validates against `usuarios` table with bcrypt
4. Backend queries `usuario_municipios` to get all assigned municipalities
5. Returns user info + all allowed municipalities (no date restrictions)
6. Frontend stores session in `localStorage` as `userSession`
7. **Role-based redirect**:
   - Admin users (rol_id = 1) → `/front/admin.html`
   - Regular users (rol_id = 2) → `/front/index.html`
8. Each page verifies session on load:
   - `script.js` (main viewer): Redirects to `/` if no session
   - `admin.js` (admin panel): Redirects to `/` if no session, redirects to `/front/index.html` if not admin
9. Logout clears `localStorage` and redirects to `/`

**Important**:
- Municipality assignments are permanent (not date-scoped)
- Each user can have multiple municipalities assigned
- Session verification happens on every page load
- Admin panel is protected - only users with rol_id = 1 or rol_nombre = "admin" can access

## Admin Functionality

Admins can:
- Create new users with roles
- Assign multiple municipalities to users (without date restriction in UI, but backend uses current date)
- View all users and their assignments

Access admin panel at `/admin` route.

## Dependencies

### Go (`back/go.mod`)
- `github.com/go-sql-driver/mysql` - MariaDB driver
- `golang.org/x/crypto` - bcrypt password hashing

### Python (`microservice/`)
- Flask - Web framework
- PyMuPDF (fitz) - PDF rendering to images

## Common Issues

1. **PDF not found**: Check that `pdfBasePath` in config.json points to correct directory and file naming matches exact format
2. **Microservice timeout**: Ensure Python service is running on port 5000
3. **Database connection**: Verify MariaDB is running and credentials in config.json are correct
4. **CORS errors**: Backend enables CORS with `Access-Control-Allow-Origin: *`

## Git Status

Recent commits show work on:
- Login functionality refinement
- PDF viewer improvements
- Layout adjustments ("tamaño de cortes")
- Phase 1 completion
- Loading indicator
