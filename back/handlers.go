package main

import (
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

type PDFInfo struct {
	Name string `json:"name"`
	Path string `json:"path"`
}

func listarHandler(w http.ResponseWriter, r *http.Request) {
	var pdfs []PDFInfo

	filepath.Walk(pdfBasePath, func(path string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".pdf") {
			relPath, _ := filepath.Rel(pdfBasePath, path)
			pdfs = append(pdfs, PDFInfo{
				Name: info.Name(),
				Path: filepath.ToSlash(relPath),
			})
		}
		return nil
	})

	writeJSON(w, pdfs)
}

func buscarHandler(w http.ResponseWriter, r *http.Request) {
	query := strings.ToLower(r.URL.Query().Get("cadena"))
	var resultados []PDFInfo

	filepath.Walk(pdfBasePath, func(path string, info os.FileInfo, err error) error {
		if err == nil && !info.IsDir() && strings.HasSuffix(strings.ToLower(info.Name()), ".pdf") {
			if strings.Contains(strings.ToLower(info.Name()), query) {
				relPath, _ := filepath.Rel(pdfBasePath, path)
				resultados = append(resultados, PDFInfo{
					Name: info.Name(),
					Path: filepath.ToSlash(relPath),
				})
			}
		}
		return nil
	})

	writeJSON(w, resultados)
}

func verHandler(w http.ResponseWriter, r *http.Request) {
	// La ruta viene después de /ver/
	encodedPath := strings.TrimPrefix(r.URL.Path, "/ver/")
	decodedPath, err := url.PathUnescape(encodedPath)
	if err != nil {
		http.Error(w, "Ruta inválida", http.StatusBadRequest)
		return
	}

	fullPath := filepath.Join(pdfBasePath, decodedPath)
	if _, err := os.Stat(fullPath); os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "application/pdf")
	http.ServeFile(w, r, fullPath)
}
