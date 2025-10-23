package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

// Programa auxiliar para generar hash de contraseñas
// Ejecutar: go run generar_hash.go
func main2() {
	password := "admin123"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		fmt.Println("Error generando hash:", err)
		return
	}

	fmt.Println("=================================")
	fmt.Println("Contraseña:", password)
	fmt.Println("Hash:", string(hash))
	fmt.Println("=================================")
	fmt.Println("\nPuedes usar este hash en el SQL:")
	fmt.Printf("INSERT INTO usuarios (username, password_hash, rol_id, activo) VALUES\n")
	fmt.Printf("('admin', '%s', 1, 1);\n", string(hash))
}
