package auth

import (
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// getJWTSecret obtiene la clave secreta de JWT desde variables de entorno
func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		// Valor por defecto (SOLO PARA DESARROLLO)
		secret = "clave_por_defecto_cambiar_en_produccion_NO_USAR_EN_PROD"
	}
	return []byte(secret)
}

// Claims personalizados para nuestro JWT
type Claims struct {
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	RolID    int    `json:"rol_id"`
	RolName  string `json:"rol_name"`
	jwt.RegisteredClaims
}

// GenerateJWT genera un token JWT para un usuario
func GenerateJWT(userID int, username string, rolID int, rolName string) (string, error) {
	// Crear claims con información del usuario
	claims := Claims{
		UserID:   userID,
		Username: username,
		RolID:    rolID,
		RolName:  rolName,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)), // Expira en 24 horas
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "visor-pdf-api",
		},
	}

	// Crear token con claims
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Firmar token con la clave secreta
	tokenString, err := token.SignedString(getJWTSecret())
	if err != nil {
		return "", fmt.Errorf("error generando token: %v", err)
	}

	return tokenString, nil
}

// ValidateJWT valida un token JWT y retorna los claims si es válido
func ValidateJWT(tokenString string) (*Claims, error) {
	// Parsear el token
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		// Verificar que el método de firma sea el esperado
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("método de firma inesperado: %v", token.Header["alg"])
		}
		return getJWTSecret(), nil
	})

	if err != nil {
		return nil, fmt.Errorf("error validando token: %v", err)
	}

	// Verificar que el token sea válido
	if claims, ok := token.Claims.(*Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("token inválido")
}

// ExtractToken extrae el token del header Authorization
// Formato esperado: "Bearer TOKEN_AQUI"
func ExtractToken(authHeader string) string {
	if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
		return authHeader[7:]
	}
	return ""
}
