package auth

import (
	"encoding/json"
	"fmt"
	"net/http"

	"visor-pdf/internal/database"
	"visor-pdf/internal/models"

	"golang.org/x/crypto/bcrypt"
)

func Login(w http.ResponseWriter, r *http.Request) {
	var loginReq models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, "Datos inválidos", http.StatusBadRequest)
		return
	}

	// Buscar usuario
	var user models.Usuario
	var passwordHash string
	err := database.DB.QueryRow(`
		SELECT u.id, u.username, u.password_hash, u.activo, u.rol_id, r.nombre as rol_nombre 
		FROM usuarios u 
		JOIN roles r ON u.rol_id = r.id 
		WHERE u.username = ?`,
		loginReq.Username).Scan(&user.ID, &user.Username, &passwordHash, &user.Activo, &user.RolID, &user.RolNombre)

	if err != nil || !user.Activo {
		http.Error(w, "Credenciales inválidas 1", http.StatusUnauthorized)
		return
	}
	fmt.Println(passwordHash)

	// Verificar contraseña
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(loginReq.Password)); err != nil {
		http.Error(w, "Credenciales inválidas 2", http.StatusUnauthorized)
		return
	}

	// Obtener municipios permitidos (sin filtro por fecha)
	rows, err := database.DB.Query(`
		SELECT DISTINCT um.municipio_id, m.nombre
		FROM usuario_municipios um
		JOIN municipios m ON um.municipio_id = m.idmunicipios
		WHERE um.usuario_id = ?`,
		user.ID)

	if err != nil {
		http.Error(w, "Error consultando permisos", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var municipiosPermitidos []models.Municipio
	for rows.Next() {
		var m models.Municipio
		rows.Scan(&m.ID, &m.Nombre)
		municipiosPermitidos = append(municipiosPermitidos, m)
	}

	// Generar token JWT
	token, err := GenerateJWT(user.ID, user.Username, user.RolID, user.RolNombre)
	if err != nil {
		http.Error(w, "Error generando token de autenticación", http.StatusInternalServerError)
		return
	}

	// Crear respuesta con token
	response := map[string]interface{}{
		"usuario":               user,
		"municipios_permitidos": municipiosPermitidos,
		"token":                 token, // Token JWT
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
