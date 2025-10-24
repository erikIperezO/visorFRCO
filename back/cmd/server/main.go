package main

import (
	"fmt"
	"log"
	"net/http"

	"visor-pdf/internal/auth"
	"visor-pdf/internal/config"
	"visor-pdf/internal/database"
	"visor-pdf/internal/handlers"
)

var cfg config.Config

func main() {
	var err error
	cfg, err = config.LoadConfig()
	if err != nil {
		log.Fatalf("Error cargando config: %v", err)
	}

	// Configurar handlers con la configuración
	handlers.SetConfig(cfg)

	database.ConnectDB(cfg)
	defer database.CloseDB()

	// Servir archivos estáticos
	http.Handle("/front/", http.StripPrefix("/front/", http.FileServer(http.Dir("../../front"))))

	// Rutas de la API
	http.HandleFunc("/api/login", auth.Login) // Login no requiere middleware

	// Endpoints protegidos con autenticación
	http.HandleFunc("/api/municipios", auth.AuthMiddleware(handlers.GetMunicipios))
	http.HandleFunc("/api/localidades", auth.AuthMiddleware(handlers.GetLocalidades))
	http.HandleFunc("/api/pdf", auth.AuthMiddleware(handlers.GetPDFAsImage))

	// Endpoints de administración (requieren ser admin)
	http.HandleFunc("/api/admin/usuarios", auth.AdminMiddleware(handlers.ListarUsuarios))
	http.HandleFunc("/api/admin/usuarios/crear", auth.AdminMiddleware(handlers.CrearUsuario))
	http.HandleFunc("/api/admin/usuarios/asignar-municipios", auth.AdminMiddleware(handlers.AsignarMunicipiosUsuario))
	http.HandleFunc("/api/admin/roles", auth.AdminMiddleware(handlers.ObtenerRoles))

	// Este endpoint lo usan tanto admins como usuarios regulares para ver sus municipios
	http.HandleFunc("/api/admin/usuarios/municipios", handlers.ObtenerMunicipiosUsuario)

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
		http.Redirect(w, r, "/front/public/login.html", http.StatusFound)
		return
	}
	http.NotFound(w, r)
}

func redirectToAdmin(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/front/public/admin.html", http.StatusFound)
}

func redirectToVisor(w http.ResponseWriter, r *http.Request) {
	http.Redirect(w, r, "/front/public/index.html", http.StatusFound)
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
