package main

import (
	"fmt"
	"log"
	"net/http"
)

var config Config

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
	http.HandleFunc("/pdf", GetPDF)

	fmt.Println("🚀 Servidor corriendo en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
