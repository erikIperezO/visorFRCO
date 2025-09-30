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

	// Servir archivos estáticos
	http.Handle("/front/", http.StripPrefix("/front/", http.FileServer(http.Dir("front"))))

	// Rutas de la API
	http.HandleFunc("/api/login", Login)
	http.HandleFunc("/api/municipios", GetMunicipios)
	http.HandleFunc("/api/localidades", GetLocalidades)
	http.HandleFunc("/api/pdf", GetPDFAsImage)
	http.HandleFunc("/api/admin/usuarios", ListarUsuarios)
	http.HandleFunc("/api/admin/usuarios/crear", CrearUsuario)
	http.HandleFunc("/api/admin/usuarios/asignar-municipios", AsignarMunicipiosUsuario)
	http.HandleFunc("/api/admin/usuarios/municipios", ObtenerMunicipiosUsuario)
	http.HandleFunc("/api/admin/roles", ObtenerRoles)

	// Rutas para páginas
	http.HandleFunc("/", serveIndex)
	http.HandleFunc("/admin", serveAdmin)

	fmt.Println("🚀 Servidor corriendo en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", enableCORS(http.DefaultServeMux)))
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "front/index.html")
}

func serveAdmin(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "front/admin.html")
}

// middleware CORS
func enableCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}
