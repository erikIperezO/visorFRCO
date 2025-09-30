package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"

	"golang.org/x/crypto/bcrypt"
)

func Login(w http.ResponseWriter, r *http.Request) {
	var loginReq LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, "Datos inválidos", http.StatusBadRequest)
		return
	}

	// Buscar usuario
	var user Usuario
	var passwordHash string
	err := db.QueryRow(`
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

	// Obtener municipios permitidos para hoy
	hoy := time.Now().Format("2006-01-02")
	rows, err := db.Query(`
		SELECT um.municipio_id, m.nombre 
		FROM usuario_municipios um 
		JOIN municipios m ON um.municipio_id = m.idmunicipios 
		WHERE um.usuario_id = ? AND um.fecha_asignacion = ?`,
		user.ID, hoy)

	if err != nil {
		http.Error(w, "Error consultando permisos", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var municipiosPermitidos []Municipio
	for rows.Next() {
		var m Municipio
		rows.Scan(&m.ID, &m.Nombre)
		municipiosPermitidos = append(municipiosPermitidos, m)
	}

	// Crear respuesta
	response := map[string]interface{}{
		"usuario":               user,
		"municipios_permitidos": municipiosPermitidos,
		"fecha":                 hoy,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
