package main

import (
	"encoding/json"
	"net/http"

	"golang.org/x/crypto/bcrypt"
)

func CrearUsuario(w http.ResponseWriter, r *http.Request) {
	var user Usuario
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Datos inválidos", http.StatusBadRequest)
		return
	}

	// Hash de contraseña
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Error procesando contraseña", http.StatusInternalServerError)
		return
	}

	result, err := db.Exec(
		"INSERT INTO usuarios (username, password_hash, rol_id, activo) VALUES (?, ?, ?, ?)",
		user.Username, string(hashedPassword), user.RolID, true)

	if err != nil {
		http.Error(w, "Error creando usuario: "+err.Error(), http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"id":      id,
		"message": "Usuario creado exitosamente",
	})
}

func ListarUsuarios(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query(`
		SELECT u.id, u.username, u.activo, u.rol_id, r.nombre as rol_nombre 
		FROM usuarios u 
		JOIN roles r ON u.rol_id = r.id
	`)
	if err != nil {
		http.Error(w, "Error consultando usuarios", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var usuarios []Usuario
	for rows.Next() {
		var u Usuario
		rows.Scan(&u.ID, &u.Username, &u.Activo, &u.RolID, &u.RolNombre)
		usuarios = append(usuarios, u)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(usuarios)
}

func AsignarMunicipiosUsuario(w http.ResponseWriter, r *http.Request) {
	var asignacion AsignacionMunicipio
	if err := json.NewDecoder(r.Body).Decode(&asignacion); err != nil {
		http.Error(w, "Datos inválidos", http.StatusBadRequest)
		return
	}

	// Eliminar asignaciones existentes para esa fecha
	_, err := db.Exec(
		"DELETE FROM usuario_municipios WHERE usuario_id = ? AND fecha_asignacion = ?",
		asignacion.UsuarioID, asignacion.FechaAsignacion)

	if err != nil {
		http.Error(w, "Error eliminando asignaciones anteriores", http.StatusInternalServerError)
		return
	}

	// Insertar nuevas asignaciones
	for _, municipioID := range asignacion.MunicipiosIDs {
		_, err := db.Exec(
			"INSERT INTO usuario_municipios (usuario_id, municipio_id, fecha_asignacion) VALUES (?, ?, ?)",
			asignacion.UsuarioID, municipioID, asignacion.FechaAsignacion)

		if err != nil {
			http.Error(w, "Error asignando municipios", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Municipios asignados exitosamente"})
}

func ObtenerMunicipiosUsuario(w http.ResponseWriter, r *http.Request) {
	usuarioID := r.URL.Query().Get("usuario_id")
	fecha := r.URL.Query().Get("fecha")

	rows, err := db.Query(`
		SELECT um.municipio_id, m.nombre 
		FROM usuario_municipios um 
		JOIN municipios m ON um.municipio_id = m.idmunicipios 
		WHERE um.usuario_id = ? AND um.fecha_asignacion = ?`,
		usuarioID, fecha)

	if err != nil {
		http.Error(w, "Error consultando municipios asignados", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var municipios []Municipio
	for rows.Next() {
		var m Municipio
		rows.Scan(&m.ID, &m.Nombre)
		municipios = append(municipios, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(municipios)
}

func ObtenerRoles(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, nombre FROM roles")
	if err != nil {
		http.Error(w, "Error consultando roles", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var roles []Rol
	for rows.Next() {
		var r Rol
		rows.Scan(&r.ID, &r.Nombre)
		roles = append(roles, r)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(roles)
}
