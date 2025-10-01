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

type Usuario struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	Password  string `json:"password,omitempty"`
	Activo    bool   `json:"activo"`
	RolID     int    `json:"rol_id"`
	RolNombre string `json:"rol_nombre,omitempty"`
}

type Rol struct {
	ID     int    `json:"id"`
	Nombre string `json:"nombre"`
}

type AsignacionMunicipio struct {
	UsuarioID     int   `json:"usuario_id"`
	MunicipiosIDs []int `json:"municipios_ids"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}
