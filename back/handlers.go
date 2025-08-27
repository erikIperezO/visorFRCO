package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
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
	fmt.Println(idMunicipio)
	rows, err := db.Query("SELECT idlocalidades, idmunicipio, nombre FROM localidades WHERE idmunicipio = ?", idMunicipio)
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

// obtiene la década a partir de un año (ej: 2015 → "2010")
func obtenerDecada(year string) (string, error) {
	if len(year) != 4 {
		return "", fmt.Errorf("año inválido: %s", year)
	}
	// convertimos a int
	y, err := strconv.Atoi(year)
	if err != nil {
		return "", err
	}
	decada := (y / 10) * 10
	return fmt.Sprintf("%d", decada), nil
}

// GetPDFAsImageMagick genera la imagen de un PDF al vuelo usando ImageMagick
func GetPDFAsImage(w http.ResponseWriter, r *http.Request) {
	year := r.URL.Query().Get("year")
	acto := r.URL.Query().Get("acto")
	municipio := r.URL.Query().Get("municipio")
	oficialia := r.URL.Query().Get("oficialia")
	localidad := r.URL.Query().Get("localidad")
	numActa := r.URL.Query().Get("numActa")

	// Validar parámetros
	if year == "" || acto == "" || municipio == "" || oficialia == "" || localidad == "" || numActa == "" {
		http.Error(w, "Faltan parámetros", http.StatusBadRequest)
		return
	}

	// Calcular década
	decada, err := obtenerDecada(year)
	if err != nil {
		http.Error(w, "Año inválido", http.StatusBadRequest)
		return
	}

	// Formatear con ceros a la izquierda
	actoFmt := fmt.Sprintf("%1s", acto)
	estado := "20"
	municipioFmt := fmt.Sprintf("%03s", municipio)
	oficialiaFmt := fmt.Sprintf("%02s", oficialia)
	numActaFmt := fmt.Sprintf("%05s", numActa)
	localidadFmt := fmt.Sprintf("%03s", localidad)

	// Nombre del archivo PDF
	fileName := fmt.Sprintf("%s%s%s%s%s%s%s0.pdf",
		actoFmt, estado, municipioFmt, oficialiaFmt, year, numActaFmt, localidadFmt)

	// Ruta del PDF
	pdfPath := filepath.Join(
		config.PDFBasePath,
		fmt.Sprintf("decada %s", decada),
		actoFmt,
		year,
		municipioFmt,
		oficialiaFmt,
		localidadFmt,
		fileName,
	)

	// Validar existencia del PDF
	if _, err := os.Stat(pdfPath); os.IsNotExist(err) {
		http.Error(w, "Archivo no encontrado", http.StatusNotFound)
		return
	}

	pythonURL := fmt.Sprintf("http://127.0.0.1:5000/pdf_to_tiles?pdf_path=%s", url.QueryEscape(pdfPath))

	resp, err := http.Get(pythonURL)
	if err != nil {
		http.Error(w, "Error llamando microservicio", 500)
		return
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		http.Error(w, "Error leyendo respuesta del microservicio", 500)
		return
	}

	// Solo reenviar la respuesta JSON al frontend
	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
