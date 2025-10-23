package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

func ConnectDB(cfg Config) {
	var err error
	// Agregar parseTime=true para manejar DATE/DATETIME correctamente
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)

	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Error conectando a la BD: %v", err)
	}

	// Configurar pool de conexiones
	db.SetMaxOpenConns(25)                 // Máximo 25 conexiones abiertas
	db.SetMaxIdleConns(10)                 // Máximo 10 conexiones inactivas
	db.SetConnMaxLifetime(5 * time.Minute) // Tiempo de vida máximo de una conexión

	if err = db.Ping(); err != nil {
		log.Fatalf("No se pudo hacer ping a la BD: %v", err)
	}

	fmt.Println("✅ Conectado a MySQL correctamente")
	fmt.Printf("📊 Pool configurado: MaxOpen=25, MaxIdle=10, MaxLifetime=5min\n")
}
