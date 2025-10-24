package handlers

import (
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"path/filepath"
	"strconv"

	"visor-pdf/internal/config"
)

var Cfg config.Config

func SetConfig(cfg config.Config) {
	Cfg = cfg
}

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
		Cfg.PDFBasePath,
		fmt.Sprintf("decada %s", decada),
		actoFmt,
		year,
		municipioFmt,
		oficialiaFmt,
		localidadFmt,
		fileName,
	)

	pythonURL := fmt.Sprintf("http://localhost:5000/pdf_to_tiles?pdf_path=%s", url.QueryEscape(pdfPath))

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

func obtenerDecada(year string) (string, error) {
	if len(year) != 4 {
		return "", fmt.Errorf("año inválido: %s", year)
	}
	y, err := strconv.Atoi(year)
	if err != nil {
		return "", err
	}
	decada := (y / 10) * 10
	return fmt.Sprintf("%d", decada), nil
}
