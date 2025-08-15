package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
)

type Config struct {
	PDFBasePath string `json:"pdfBasePath"`
}

var pdfBasePath string

func loadConfig() {
	data, err := os.ReadFile("config.json")
	if err != nil {
		log.Fatalf("Error leyendo config.json: %v", err)
	}

	var config Config
	if err := json.Unmarshal(data, &config); err != nil {
		log.Fatalf("Error parseando config.json: %v", err)
	}

	pdfBasePath = config.PDFBasePath
	fmt.Println("📂 Ruta base PDFs:", pdfBasePath)
}

func main() {
	loadConfig()

	http.HandleFunc("/listar", listarHandler)
	http.HandleFunc("/buscar", buscarHandler)
	http.HandleFunc("/ver/", verHandler)

	fmt.Println("Servidor escuchando en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
