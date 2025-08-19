package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
)

// Lista municipios
func GetMunicipios(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT idmunicipios, nombre FROM municipios")
	if err != nil {
		http.Error(w, "Error consultando municipios", 500)
		return
	}
	defer rows.Close()

	var municipios []Municipio
	for rows.Next() {
		var m Municipio
		if err := rows.Scan(&m.ID, &m.Nombre); err != nil {
			http.Error(w, "Error leyendo datos", 500)
			return
		}
		municipios = append(municipios, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(municipios)
}

// Lista localidades por municipio
func GetLocalidades(w http.ResponseWriter, r *http.Request) {
	idMunicipio := r.URL.Query().Get("idmunicipio")
	if idMunicipio == "" {
		http.Error(w, "Falta idmunicipio", 400)
		return
	}

	rows, err := db.Query("SELECT idlocalidades, idmunicipio, nombre FROM localidad WHERE idmunicipio = ?", idMunicipio)
	if err != nil {
		http.Error(w, "Error consultando localidades", 500)
		return
	}
	defer rows.Close()

	var localidades []Localidad
	for rows.Next() {
		var l Localidad
		if err := rows.Scan(&l.ID, &l.IDMunicipio, &l.Nombre); err != nil {
			http.Error(w, "Error leyendo datos", 500)
			return
		}
		localidades = append(localidades, l)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(localidades)
}

// GetPDF devuelve el PDF con la nomenclatura correcta para ruta y nombre de archivo
func GetPDF(w http.ResponseWriter, r *http.Request) {
	year := r.URL.Query().Get("year")           // ej: 2010
	acto := r.URL.Query().Get("acto")           // ej: 1
	municipio := r.URL.Query().Get("municipio") // ej: 67
	oficialia := r.URL.Query().Get("oficialia") // ej: 1
	localidad := r.URL.Query().Get("localidad") // ej: 1
	numActa := r.URL.Query().Get("numActa")     // ej: 5

	// Validar que todos los parámetros existan
	if year == "" || acto == "" || municipio == "" || oficialia == "" || localidad == "" || numActa == "" {
		http.Error(w, "Faltan parámetros", http.StatusBadRequest)
		return
	}

	// Convertir a la nomenclatura correcta con ceros a la izquierda
	actoFmt := fmt.Sprintf("%1s", acto)            // 1 dígito
	estado := "20"                                 // siempre 20
	municipioFmt := fmt.Sprintf("%03s", municipio) // 3 dígitos
	oficialiaFmt := fmt.Sprintf("%02s", oficialia) // 2 dígitos
	numActaFmt := fmt.Sprintf("%05s", numActa)     // 5 dígitos
	localidadFmt := fmt.Sprintf("%03s", localidad) // 3 dígitos

	// Construir nombre del PDF: acto + estado + municipio + oficialía + año + número de acta + localidad + 0
	fileName := fmt.Sprintf("%s%s%s%s%s%s%s0.pdf",
		actoFmt, estado, municipioFmt, oficialiaFmt, year, numActaFmt, localidadFmt)

	// Construir ruta completa al PDF
	pdfPath := filepath.Join(
		config.PDFBasePath,
		fmt.Sprintf("decada %s", year[:4]), // decada 2010
		actoFmt,                            // acto registral
		year,                               // año específico
		municipioFmt,                       // municipio
		oficialiaFmt,                       // oficialía
		localidadFmt,                       // localidad
		fileName,                           // nombre del PDF
	)

	// Verificar si el archivo existe
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		http.Error(w, "Archivo no encontrado", http.StatusNotFound)
		return
	}

	// Devolver el PDF
	http.ServeFile(w, r, pdfPath)
}
