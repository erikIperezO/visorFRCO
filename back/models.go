package main

type Municipio struct {
	ID     int    `json:"id"`
	Nombre string `json:"nombre"`
}

type Localidad struct {
	ID          int    `json:"idlocalidades"`
	IDMunicipio int    `json:"id_municipio"`
	Nombre      string `json:"nombre"`
}

type PDFRequest struct {
	Decada    string `json:"decada"`
	Anio      string `json:"anio"`
	Municipio string `json:"municipio"`
	Localidad string `json:"localidad"`
	Oficialia string `json:"oficialia"`
	NumActa   string `json:"num_acta"`
}
