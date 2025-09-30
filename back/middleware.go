package main

import "net/http"

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// En una implementación real, verificar token JWT o sesión
		// Por ahora, permitir todas las requests
		next.ServeHTTP(w, r)
	}
}

func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// En una implementación real, verificar si es admin
		// Por ahora, permitir todas las requests
		next.ServeHTTP(w, r)
	}
}
