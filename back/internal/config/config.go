package config

import (
	"encoding/json"
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	PDFBasePath string `json:"pdfBasePath"`
	DBUser      string `json:"dbUser"`
	DBPassword  string `json:"dbPassword"`
	DBHost      string `json:"dbHost"`
	DBPort      string `json:"dbPort"`
	DBName      string `json:"dbName"`
}

func LoadConfig() (Config, error) {
	// Intentar cargar .env si existe (ignorar error si no existe)
	_ = godotenv.Load("../../.env")      // Desde cmd/server/
	_ = godotenv.Load(".env")            // Desde back/
	_ = godotenv.Load("back/.env")       // Desde raíz

	// Prioridad 1: Variables de entorno
	config := Config{
		PDFBasePath: getEnv("PDF_BASE_PATH", ""),
		DBUser:      getEnv("DB_USER", ""),
		DBPassword:  getEnv("DB_PASSWORD", ""),
		DBHost:      getEnv("DB_HOST", "localhost"),
		DBPort:      getEnv("DB_PORT", "3306"),
		DBName:      getEnv("DB_NAME", "digitalizacion"),
	}

	// Si no hay variables de entorno, intentar cargar desde config.json
	if config.DBUser == "" || config.DBPassword == "" || config.PDFBasePath == "" {
		fmt.Println("⚠️  Variables de entorno no encontradas, usando config.json...")

		// Intentar buscar config.json en múltiples ubicaciones
		configPaths := []string{
			"../../config.json",      // Cuando se ejecuta desde cmd/server/
			"config.json",            // Cuando se ejecuta desde back/
			"back/config.json",       // Cuando se ejecuta desde la raíz del proyecto
			"../../../config.json",   // Por si acaso
		}

		var file *os.File
		var err error

		// Buscar el archivo en las ubicaciones posibles
		for _, path := range configPaths {
			file, err = os.Open(path)
			if err == nil {
				// Archivo encontrado
				defer file.Close()
				err = json.NewDecoder(file).Decode(&config)
				if err != nil {
					return config, fmt.Errorf("error decodificando config.json: %v", err)
				}
				fmt.Printf("✅ Configuración cargada desde: %s\n", path)
				return config, nil
			}
		}

		// Si no se encontró en ninguna ubicación
		return config, fmt.Errorf("config.json no encontrado y sin variables de entorno")
	}

	fmt.Println("✅ Configuración cargada desde variables de entorno")
	return config, nil
}

// getEnv obtiene una variable de entorno o retorna un valor por defecto
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
