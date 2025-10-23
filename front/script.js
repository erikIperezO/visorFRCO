const API_BASE = "http://172.19.2.220:8080/api";

// =============================================
// HELPER PARA FETCH CON AUTENTICACIÓN
// =============================================
function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('authToken');

    // Agregar header de autenticación
    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };

    return fetch(url, authOptions);
}

// =============================================
// ESTADO GLOBAL DE LA APLICACIÓN
// =============================================
const AppState = {
    usuarioLogueado: null,
    municipiosPermitidos: [],
    municipios: [],
    pages: [],
    currentPage: 0,
    zoomLevel: 1,
    municipioSelected: 0,

    // Estado de panning
    isPanning: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,

    // Dropdown municipios
    municipioDropdownIndex: -1
};

// =============================================
// ELEMENTOS DEL DOM
// =============================================
const DOM = {
    mainContainer: document.getElementById('main-container'),

    // Búsqueda
    municipioSearch: document.getElementById('municipioSearch'),
    municipioDropdown: document.getElementById('municipioDropdown'),
    localidadSelect: document.getElementById('localidadSelect'),
    yearInput: document.getElementById('yearInput'),
    actoInput: document.getElementById('actoInput'),
    oficialiaInput: document.getElementById('oficialiaInput'),
    numActaInput: document.getElementById('numActaInput'),
    buscarBtn: document.getElementById('buscarBtn'),
    limpiarBtn: document.getElementById('limpiarBtn'),

    // Visor
    pdfViewer: document.getElementById('pdf-viewer'),
    viewerContainer: document.getElementById('viewer-container'),
    prevBtn: document.getElementById("prev-page"),
    nextBtn: document.getElementById("next-page"),
    loader: document.getElementById("loader"),

    // Zoom
    zoomInBtn: document.getElementById("zoom-in"),
    zoomOutBtn: document.getElementById("zoom-out"),
    resetZoomBtn: document.getElementById("reset-zoom"),
    zoomLevelElement: document.getElementById('zoom-level'),

    // Usuario
    userNameElement: document.getElementById('user-name'),
    userRoleElement: document.getElementById('user-role'),

    // Navegación
    currentPageElement: document.getElementById('current-page'),
    totalPagesElement: document.getElementById('total-pages'),

    // Notificación
    notification: document.getElementById('notification')
};

// =============================================
// SERVICIO DE ZOOM
// =============================================
class ZoomService {
    static aplicarZoom(nuevoZoom) {
        if (!DOM.pdfViewer.firstChild || DOM.pdfViewer.firstChild.classList.contains('empty-state')) return;

        const scrollTopAntes = DOM.viewerContainer.scrollTop;
        const scrollLeftAntes = DOM.viewerContainer.scrollLeft;

        AppState.zoomLevel = Math.max(0.25, Math.min(5, nuevoZoom));
        DOM.pdfViewer.style.transform = `scale(${AppState.zoomLevel})`;

        UI.actualizarIndicadorZoom();

        setTimeout(() => {
            ZoomService.centrarHorizontalmente();
            DOM.viewerContainer.scrollLeft = scrollLeftAntes;
            DOM.viewerContainer.scrollTop = scrollTopAntes;
        }, 10);
    }

    static zoomIn() { this.aplicarZoom(AppState.zoomLevel + 0.25); }
    static zoomOut() { this.aplicarZoom(AppState.zoomLevel - 0.25); }

    static resetZoom() {
        AppState.zoomLevel = 1;
        DOM.pdfViewer.style.transform = `scale(1)`;
        UI.actualizarIndicadorZoom();
        this.centrarCompletamente();
    }

    static zoomConRueda(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.aplicarZoom(AppState.zoomLevel * zoomFactor);
        }
    }

    static centrarCompletamente() {
        if (DOM.pdfViewer.firstChild && !DOM.pdfViewer.firstChild.classList.contains('empty-state')) {
            const contenido = DOM.pdfViewer.firstChild;
            const anchoEscalado = contenido.offsetWidth * AppState.zoomLevel;
            const anchoContenedor = DOM.viewerContainer.clientWidth;
            DOM.viewerContainer.scrollLeft = Math.max(0, (anchoEscalado - anchoContenedor) / 2);
            DOM.viewerContainer.scrollTop = 0;
        }
    }

    static centrarHorizontalmente() {
        if (DOM.pdfViewer.firstChild && !DOM.pdfViewer.firstChild.classList.contains('empty-state')) {
            const contenido = DOM.pdfViewer.firstChild;
            const anchoEscalado = contenido.offsetWidth * AppState.zoomLevel;
            const anchoContenedor = DOM.viewerContainer.clientWidth;
            DOM.viewerContainer.scrollLeft = Math.max(0, (anchoEscalado - anchoContenedor) / 2);
        }
    }
}

// =============================================
// SERVICIO DE MUNICIPIOS
// =============================================
class MunicipioService {
    

    static async cargarMunicipios() {
        try {
            // SIN USUARIO LOGUEADO - NO CARGAR NADA
            if (!AppState.usuarioLogueado) {
                AppState.municipios = [];
                return;
            }

            // CON USUARIO LOGUEADO - CARGAR DIRECTAMENTE LOS MUNICIPIOS ASIGNADOS
            const url = `${API_BASE}/admin/usuarios/municipios?usuario_id=${AppState.usuarioLogueado.id}`;
            const response = await authenticatedFetch(url);
            
            if (response.ok) {
                AppState.municipios = await response.json();
            } else {
                AppState.municipios = [];
                console.error('Error cargando municipios asignados');
            }
            
        } catch (error) {
            console.error('Error cargando municipios:', error);
            Notification.show('Error cargando municipios', 'error');
            AppState.municipios = [];
        }
    }

    static filtrarMunicipios(searchTerm) {
        const value = searchTerm.toLowerCase();
        DOM.municipioDropdown.innerHTML = "";
        AppState.municipioDropdownIndex = -1;

        // Si no hay usuario logueado o no tiene municipios, no mostrar dropdown
        if (!AppState.usuarioLogueado || AppState.municipios.length === 0) {
            DOM.municipioDropdown.style.display = "none";
            return;
        }

        if (!value) {
            DOM.municipioDropdown.style.display = "none";
            return;
        }

        // Ya tenemos solo los municipios asignados, solo filtramos por nombre
        const filteredMunicipios = AppState.municipios.filter(m =>
            m.nombre.toLowerCase().includes(value)
        );

        if (filteredMunicipios.length === 0) {
            DOM.municipioDropdown.style.display = "none";
            return;
        }

        filteredMunicipios.forEach(municipio => {
            const div = document.createElement("div");
            div.textContent = municipio.nombre;
            div.onclick = () => this.seleccionarMunicipio(municipio);
            DOM.municipioDropdown.appendChild(div);
        });

        DOM.municipioDropdown.style.display = "block";
    }

    static async cargarLocalidades(idMunicipio) {
        // Validar que el usuario esté logueado
        if (!AppState.usuarioLogueado) {
            Notification.show('Debe iniciar sesión para acceder a las localidades', 'error');
            return;
        }

        if (!idMunicipio) return;
        
        // Validar que el municipio seleccionado esté en los municipios asignados
        const municipioPermitido = AppState.municipios.some(m => m.id === parseInt(idMunicipio));
        if (!municipioPermitido) {
            Notification.show('No tiene permisos para este municipio', 'error');
            DOM.municipioSearch.value = '';
            AppState.municipioSelected = 0;
            return;
        }
        
        try {
            const response = await authenticatedFetch(`${API_BASE}/localidades?idmunicipio=${idMunicipio}`);
            const localidades = await response.json();

            DOM.localidadSelect.innerHTML = '<option value="">Seleccione localidad</option>';
            if (localidades.length > 0) {
                localidades.forEach((localidad, index) => {
                    const option = document.createElement('option');
                    option.value = localidad.idlocalidades;
                    option.textContent = `${localidad.idlocalidades}-${localidad.nombre}`;
                    DOM.localidadSelect.appendChild(option);
                    if (index === 0) DOM.localidadSelect.value = localidad.idlocalidades;
                });
            }
        } catch (error) {
            console.error('Error cargando localidades:', error);
        }
    }

    static seleccionarMunicipio(municipio) {
        // Validar que el municipio esté en la lista de asignados
        const municipioPermitido = AppState.municipios.some(m => m.id === municipio.id);
        if (!municipioPermitido) {
            Notification.show('No tiene permisos para este municipio', 'error');
            return;
        }

        DOM.municipioSearch.value = municipio.nombre;
        AppState.municipioSelected = municipio.id;
        DOM.municipioDropdown.style.display = "none";
        this.cargarLocalidades(municipio.id);
    }


    static resaltarMunicipio(index) {
        const items = DOM.municipioDropdown.querySelectorAll("div");
        items.forEach((item, i) => {
            item.classList.toggle("active", i === index);
        });
    }
}

// =============================================
// SERVICIO DE PDF
// =============================================
class PDFService {
     static async buscarPDF() {
        // Validar que el usuario esté logueado
        if (!AppState.usuarioLogueado) {
            Notification.show('Debe iniciar sesión para realizar búsquedas', 'error');
            return;
        }

        const { year, acto, municipio, oficialia, localidad, numActa } = this.validarFormulario();
        if (!year) return;

        // Validación adicional de permisos - verificar que el municipio esté en los asignados
        const municipioPermitido = AppState.municipios.some(m => m.id === parseInt(municipio));
        if (!municipioPermitido) {
            Notification.show('No tiene permisos para buscar en este municipio', 'error');
            return;
        }

        DOM.loader.style.display = "block";
        DOM.pdfViewer.innerHTML = "";

        try {
            const url = `${API_BASE}/pdf?year=${year}&acto=${acto}&municipio=${municipio}&oficialia=${oficialia}&localidad=${localidad}&numActa=${numActa}`;
            const response = await authenticatedFetch(url);
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            AppState.pages = data.pages;
            AppState.currentPage = 0;
            AppState.zoomLevel = 1;

            this.mostrarPagina(AppState.currentPage);
            UI.actualizarContadorPaginas();
            Notification.show('Acta encontrada', 'success');
        } catch (error) {
            Notification.show('Acta no encontrada: ' + error.message, 'error');
        } finally {
            DOM.loader.style.display = "none";
        }
    }

    static validarFormulario() {
        const year = DOM.yearInput.value;
        const acto = DOM.actoInput.value;
        const municipio = AppState.municipioSelected;
        const oficialia = DOM.oficialiaInput.value;
        const localidad = DOM.localidadSelect.value;
        const numActa = DOM.numActaInput.value;

        if (!year || !acto || !municipio || !oficialia || !localidad || !numActa) {
            Notification.show('Complete todos los campos.', 'error');
            return {};
        }

        return { year, acto, municipio, oficialia, localidad, numActa };
    }

    static mostrarPagina(pageIndex) {
        if (AppState.pages.length === 0 || !AppState.pages[pageIndex]) {
            this.mostrarEstadoVacio();
            return;
        }

        const page = AppState.pages[pageIndex];
        const { maxX, maxY } = this.calcularDimensionesPagina(page.tiles);

        let html = `<div class="pdf-page" style="width:${maxX}px; height:${maxY}px; position:relative;">`;
        let imagesLoaded = 0;
        const totalImages = page.tiles.length;

        page.tiles.forEach(tile => {
            const img = new Image();
            img.src = `data:image/png;base64,${tile.image}`;
            img.style.position = 'absolute';
            img.style.left = `${tile.x}px`;
            img.style.top = `${tile.y}px`;
            img.style.width = `${tile.width}px`;
            img.style.height = `${tile.height}px`;

            img.onload = () => {
                imagesLoaded++;
                if (imagesLoaded === totalImages) this.finalizarCargaPagina();
            };
            img.onerror = () => {
                imagesLoaded++;
                if (imagesLoaded === totalImages) DOM.loader.style.display = "none";
            };

            html += img.outerHTML;
        });

        html += `</div>`;
        DOM.pdfViewer.innerHTML = html;

        UI.actualizarBotonesNavegacion();
        UI.actualizarContadorPaginas();
    }

    static calcularDimensionesPagina(tiles) {
        let maxX = 0, maxY = 0;
        tiles.forEach(tile => {
            maxX = Math.max(maxX, tile.x + tile.width);
            maxY = Math.max(maxY, tile.y + tile.height);
        });
        return { maxX, maxY };
    }

    static finalizarCargaPagina() {
        DOM.loader.style.display = "none";
        AppState.zoomLevel = 1;
        DOM.pdfViewer.style.transform = `scale(1)`;
        UI.actualizarIndicadorZoom();

        setTimeout(() => ZoomService.centrarCompletamente(), 100);
    }

    static mostrarEstadoVacio() {
        DOM.pdfViewer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-pdf"></i>
                <h3>No se ha seleccionado un acta</h3>
                <p>Complete el formulario de búsqueda y haga clic en "Buscar Acta".</p>
            </div>
        `;
        DOM.loader.style.display = "none";
        UI.actualizarContadorPaginas();
    }

    static limpiarFormulario() {
        DOM.municipioSearch.value = '';
        AppState.municipioSelected = 0;
        DOM.localidadSelect.innerHTML = '<option value="">Seleccione localidad</option>';
        DOM.yearInput.value = '';
        // DOM.actoInput.value = '';
        DOM.oficialiaInput.value = '';
        DOM.numActaInput.value = '';
        AppState.pages = [];
        AppState.currentPage = 0;
        AppState.zoomLevel = 1;
        DOM.pdfViewer.style.transform = `scale(1)`;
        this.mostrarEstadoVacio();
        UI.actualizarIndicadorZoom();
        Notification.show('Formulario limpiado correctamente', 'success');
    }
}

// =============================================
// SERVICIO DE PANNING
// =============================================
class PanningService {
    static iniciarPanning(e) {
        if (e.button === 0) {
            AppState.isPanning = true;
            DOM.viewerContainer.style.cursor = "grabbing";
            AppState.startX = e.pageX - DOM.viewerContainer.offsetLeft;
            AppState.startY = e.pageY - DOM.viewerContainer.offsetTop;
            AppState.scrollLeft = DOM.viewerContainer.scrollLeft;
            AppState.scrollTop = DOM.viewerContainer.scrollTop;
            e.preventDefault();
        }
    }

    static moverPanning(e) {
        if (!AppState.isPanning) return;
        const x = e.pageX - DOM.viewerContainer.offsetLeft;
        const y = e.pageY - DOM.viewerContainer.offsetTop;
        const walkX = (x - AppState.startX) * 2;
        const walkY = (y - AppState.startY) * 2;
        DOM.viewerContainer.scrollLeft = AppState.scrollLeft - walkX;
        DOM.viewerContainer.scrollTop = AppState.scrollTop - walkY;
    }

    static detenerPanning() {
        AppState.isPanning = false;
        DOM.viewerContainer.style.cursor = "grab";
    }
}

// =============================================
// SERVICIO DE NAVEGACIÓN
// =============================================
class NavegacionService {
    static paginaAnterior() {
        if (AppState.currentPage > 0) {
            AppState.currentPage--;
            DOM.loader.style.display = "block";
            PDFService.mostrarPagina(AppState.currentPage);
        }
    }

    static paginaSiguiente() {
        if (AppState.currentPage < AppState.pages.length - 1) {
            AppState.currentPage++;
            DOM.loader.style.display = "block";
            PDFService.mostrarPagina(AppState.currentPage);
        }
    }
}

// =============================================
// UI Y NOTIFICACIONES
// =============================================
class UI {
    static mostrarInterfazPrincipal() {
        DOM.mainContainer.style.display = 'block';
        DOM.userNameElement.textContent = AppState.usuarioLogueado.username;
        DOM.userRoleElement.textContent = `Rol: ${AppState.usuarioLogueado.rol_nombre}`;
    }

    static actualizarBotonesNavegacion() {
        if (AppState.pages.length <= 1) {
            DOM.prevBtn.classList.add("hidden");
            DOM.nextBtn.classList.add("hidden");
            return;
        }
        DOM.prevBtn.classList.toggle("hidden", AppState.currentPage === 0);
        DOM.nextBtn.classList.toggle("hidden", AppState.currentPage === AppState.pages.length - 1);
    }

    static actualizarContadorPaginas() {
        DOM.currentPageElement.textContent = AppState.currentPage + 1;
        DOM.totalPagesElement.textContent = AppState.pages.length;
    }

    static actualizarIndicadorZoom() {
        DOM.zoomLevelElement.textContent = `${Math.round(AppState.zoomLevel * 100)}%`;
    }
}

class Notification {
    static show(message, type = 'success') {
        DOM.notification.textContent = message;
        DOM.notification.className = `notification ${type}`;
        DOM.notification.classList.add('show');
        setTimeout(() => DOM.notification.classList.remove('show'), 3000);
    }
}

// =============================================
// EVENTOS
// =============================================
class EventManager {
    static inicializar() {
        this.inicializarBusqueda();
        this.inicializarZoom();
        this.inicializarNavegacion();
        this.inicializarPanning();
        this.inicializarUtilidades();
    }

    static inicializarBusqueda() {
        DOM.municipioSearch.addEventListener("input", (e) => {
            MunicipioService.filtrarMunicipios(e.target.value);
        });

        DOM.buscarBtn.addEventListener('click', () => PDFService.buscarPDF());

        // Teclas ↑ ↓ Enter
        DOM.municipioSearch.addEventListener("keydown", (e) => {
            const items = DOM.municipioDropdown.querySelectorAll("div");
            if (items.length === 0) return;

            if (e.key === "ArrowDown") {
                e.preventDefault();
                AppState.municipioDropdownIndex = (AppState.municipioDropdownIndex + 1) % items.length;
                MunicipioService.resaltarMunicipio(AppState.municipioDropdownIndex);
            }
            else if (e.key === "ArrowUp") {
                e.preventDefault();
                AppState.municipioDropdownIndex = (AppState.municipioDropdownIndex - 1 + items.length) % items.length;
                MunicipioService.resaltarMunicipio(AppState.municipioDropdownIndex);
            }
            else if (e.key === "Enter") {
                e.preventDefault();
                if (AppState.municipioDropdownIndex >= 0) {
                    items[AppState.municipioDropdownIndex].click();
                }
            }
        });

        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', (event) => {
            if (!DOM.municipioSearch.contains(event.target) && !DOM.municipioDropdown.contains(event.target)) {
                DOM.municipioDropdown.style.display = 'none';
            }
        });
    }

    static inicializarZoom() {
        DOM.zoomInBtn.addEventListener("click", () => ZoomService.zoomIn());
        DOM.zoomOutBtn.addEventListener("click", () => ZoomService.zoomOut());
        DOM.resetZoomBtn.addEventListener("click", () => ZoomService.resetZoom());
        DOM.viewerContainer.addEventListener("wheel", (e) => ZoomService.zoomConRueda(e), { passive: false });
    }

    static inicializarNavegacion() {
        DOM.prevBtn.addEventListener("click", () => NavegacionService.paginaAnterior());
        DOM.nextBtn.addEventListener("click", () => NavegacionService.paginaSiguiente());
    }

    static inicializarPanning() {
        DOM.viewerContainer.addEventListener("mousedown", (e) => PanningService.iniciarPanning(e));
        document.addEventListener("mousemove", (e) => PanningService.moverPanning(e));
        document.addEventListener("mouseup", () => PanningService.detenerPanning());
    }

    static inicializarUtilidades() {
        DOM.limpiarBtn.addEventListener("click", () => PDFService.limpiarFormulario());
    }
}



// =============================================
// APP PRINCIPAL
// =============================================
class App {
    static init() {
        UI.actualizarContadorPaginas();
        UI.actualizarIndicadorZoom();
        DOM.viewerContainer.style.cursor = "grab";

        // Verificar sesión
        const session = localStorage.getItem("userSession");
        if (!session) {
            window.location.href = "/front/login.html";
            return;
        }

        const data = JSON.parse(session);
        AppState.usuarioLogueado = data.usuario;
        AppState.municipiosPermitidos = data.municipios_permitidos;

        UI.mostrarInterfazPrincipal();
        MunicipioService.cargarMunicipios();
        EventManager.inicializar();

        console.log("Aplicación inicializada correctamente");
    }
}


// Cerrar sesión
function logout() {
    localStorage.removeItem('userSession');
    localStorage.removeItem('authToken'); // Eliminar token JWT
    window.location.href = '/front/login.html';
}

document.addEventListener('DOMContentLoaded', () => App.init());
