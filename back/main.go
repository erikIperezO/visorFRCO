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
	http.HandleFunc("/api/login", Login) // Login no requiere middleware

	// Endpoints protegidos con autenticación
	http.HandleFunc("/api/municipios", AuthMiddleware(GetMunicipios))
	http.HandleFunc("/api/localidades", AuthMiddleware(GetLocalidades))
	http.HandleFunc("/api/pdf", AuthMiddleware(GetPDFAsImage))

	// Endpoints de administración (requieren ser admin)
	http.HandleFunc("/api/admin/usuarios", AdminMiddleware(ListarUsuarios))
	http.HandleFunc("/api/admin/usuarios/crear", AdminMiddleware(CrearUsuario))
	http.HandleFunc("/api/admin/usuarios/asignar-municipios", AdminMiddleware(AsignarMunicipiosUsuario))
	http.HandleFunc("/api/admin/roles", AdminMiddleware(ObtenerRoles))

	// Este endpoint lo usan tanto admins como usuarios regulares para ver sus municipios
	http.HandleFunc("/api/admin/usuarios/municipios", ObtenerMunicipiosUsuario)

	// Rutas para páginas
	http.HandleFunc("/", redirectToLogin)
	http.HandleFunc("/admin", redirectToAdmin)
	http.HandleFunc("/visor", redirectToVisor)

	fmt.Println("🚀 Servidor corriendo en http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", enableCORS(http.DefaultServeMux)))
}

func redirectToLogin(w http.ResponseWriter, r *http.Request) {
	// Solo redirigir si es exactamente la raíz "/"
	if r.URL.Path == "/" {
		http.Redirect(w, r, "/front/login.html", http.StatusFound)
		return
	}
	http.NotFound(w, r)
}

func redirectToAdmin(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/front/admin.html", http.StatusFound)
}

func redirectToVisor(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/front/index.html", http.StatusFound)
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
