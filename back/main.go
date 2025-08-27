package main

import (
	"fmt"
	"log"
	"net/http"
)

var config Config

// middleware simple para habilitar CORS
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Permitir cualquier origen (puedes restringirlo después)
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Para preflight requests (OPTIONS)
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func main() {
	var err error
	config, err = LoadConfig()
	if err != nil {
		log.Fatalf("Error cargando config: %v", err)
	}

	ConnectDB(config)
	defer db.Close()

	http.HandleFunc("/municipios", GetMunicipios)
	http.HandleFunc("/localidades", GetLocalidades)
	http.HandleFunc("/pdf", GetPDFAsImage)

	fmt.Println("🚀 Servidor corriendo en http://localhost:8080")
	// envolver el DefaultServeMux con CORS
	log.Fatal(http.ListenAndServe(":8080", enableCORS(http.DefaultServeMux)))
}
