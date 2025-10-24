package auth

import (
	"context"
	"net/http"
)

// AuthMiddleware - Verifica que haya autenticación con JWT
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Obtener header Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "No autorizado - Token requerido", http.StatusUnauthorized)
			return
		}

		// Extraer token del header "Bearer TOKEN"
		tokenString := ExtractToken(authHeader)
		if tokenString == "" {
			http.Error(w, "No autorizado - Formato de token inválido", http.StatusUnauthorized)
			return
		}

		// Validar token JWT
		claims, err := ValidateJWT(tokenString)
		if err != nil {
			http.Error(w, "No autorizado - Token inválido o expirado", http.StatusUnauthorized)
			return
		}

		// Agregar claims al contexto para usar en los handlers
		ctx := context.WithValue(r.Context(), "claims", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// AdminMiddleware - Verifica que sea un administrador
func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Obtener header Authorization
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "No autorizado - Token requerido", http.StatusUnauthorized)
			return
		}

		// Extraer token del header "Bearer TOKEN"
		tokenString := ExtractToken(authHeader)
		if tokenString == "" {
			http.Error(w, "No autorizado - Formato de token inválido", http.StatusUnauthorized)
			return
		}

		// Validar token JWT
		claims, err := ValidateJWT(tokenString)
		if err != nil {
			http.Error(w, "No autorizado - Token inválido o expirado", http.StatusUnauthorized)
			return
		}

		// Verificar que sea administrador (rol_id = 1 o rol_name = "admin")
		if claims.RolID != 1 && claims.RolName != "admin" {
			http.Error(w, "Acceso denegado - Solo administradores", http.StatusForbidden)
			return
		}

		// Agregar claims al contexto
		ctx := context.WithValue(r.Context(), "claims", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	}
}
