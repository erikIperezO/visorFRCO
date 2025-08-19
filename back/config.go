package main

import (
	"encoding/json"
	"os"
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
	var config Config
	file, err := os.Open("config.json")
	if err != nil {
		return config, err
	}
	defer file.Close()

	err = json.NewDecoder(file).Decode(&config)
	return config, err
}
