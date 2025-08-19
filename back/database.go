package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

var db *sql.DB

func ConnectDB(cfg Config) {
	var err error
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatalf("Error conectando a la BD: %v", err)
	}

	if err = db.Ping(); err != nil {
		log.Fatalf("No se pudo hacer ping a la BD: %v", err)
	}

	fmt.Println("✅ Conectado a MySQL correctamente")
}
