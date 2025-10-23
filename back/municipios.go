package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
)

func GetMunicipios(w http.ResponseWriter, r *http.Request) {
	usuarioID := r.URL.Query().Get("usuario_id")

	var rows *sql.Rows
	var err error

	if usuarioID != "" {
		// Municipios permitidos para ese usuario (sin filtro por fecha)
		rows, err = db.Query(`
			SELECT DISTINCT m.idmunicipios, m.nombre
			FROM usuario_municipios um
			JOIN municipios m ON um.municipio_id = m.idmunicipios
			WHERE um.usuario_id = ?`,
			usuarioID)
	} else {
		// Todos los municipios (para administradores)
		rows, err = db.Query("SELECT idmunicipios, nombre FROM municipios")
	}

	if err != nil {
		http.Error(w, "Error consultando municipios: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var municipios []Municipio
	for rows.Next() {
		var m Municipio
		if err := rows.Scan(&m.ID, &m.Nombre); err != nil {
			http.Error(w, "Error leyendo datos: "+err.Error(), http.StatusInternalServerError)
			return
		}
		municipios = append(municipios, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(municipios)
}

func GetLocalidades(w http.ResponseWriter, r *http.Request) {
	idMunicipio := r.URL.Query().Get("idmunicipio")
	if idMunicipio == "" {
		http.Error(w, "Falta idmunicipio", http.StatusBadRequest)
		return
	}

	rows, err := db.Query("SELECT idlocalidades, idmunicipio, nombre FROM localidades WHERE idmunicipio = ?", idMunicipio)
	if err != nil {
		http.Error(w, "Error consultando localidades: "+err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var localidades []Localidad
	for rows.Next() {
		var l Localidad
		if err := rows.Scan(&l.ID, &l.IDMunicipio, &l.Nombre); err != nil {
			http.Error(w, "Error leyendo datos: "+err.Error(), http.StatusInternalServerError)
			return
		}
		localidades = append(localidades, l)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(localidades)
}
