// =============================================
// CONFIGURACIÓN Y CONSTANTES
// =============================================
const CONFIG = {
    API_BASE: "http://localhost:8080/api",
    NOTIFICATION_TIMEOUT: 3000
};

const SELECTORS = {
    TABS: {
        CONTAINER: '.tab',
        CONTENT: '.tab-content'
    },
    FORMS: {
        CREATE_USER: '#crearUsuarioForm'
    },
    ELEMENTS: {
        ROLE_SELECT: '#rol',
        USER_LIST: '#listaUsuarios',
        MUNICIPALITIES_CONTAINER: '#municipiosDisponibles',
        NOTIFICATION: '#notification',
        TOTAL_USUARIOS: '#totalUsuarios',
        CONTADOR_MUNICIPIOS: '#contadorMunicipios',
        // Elementos para autocompletado
        BUSCAR_USUARIO: '#buscarUsuario',
        AUTOCOMPLETE_USUARIOS: '#autocompleteUsuarios',
        USUARIO_ASIGNACION_ID: '#usuarioAsignacionId',
        USUARIO_SELECCIONADO_INFO: '#usuarioSeleccionadoInfo',
        USUARIO_SELECCIONADO_NOMBRE: '#usuarioSeleccionadoNombre',
        USUARIO_SELECCIONADO_ROL: '#usuarioSeleccionadoRol',
        MUNICIPIOS_ASIGNADOS_INFO: '#municipiosAsignadosInfo'
    },
    FILTERS: {
        USUARIOS: '#filtroUsuarios',
        MUNICIPIOS: '#filtroMunicipios'
    }
};

// Variables globales para almacenar datos
let allUsers = [];
let allMunicipalities = [];
let userMunicipalities = new Map();

// =============================================
// MÓDULO DE API (SIMPLIFICADO)
// =============================================
const ApiService = {
    async request(endpoint, options = {}) {
        const url = `${CONFIG.API_BASE}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`Error en API (${endpoint}):`, error);
            throw new Error(`Error de conexión: ${error.message}`);
        }
    },

    async getRoles() {
        return this.request('/admin/roles');
    },

    async getUsers() {
        return this.request('/admin/usuarios');
    },

    async getMunicipalities() {
        return this.request('/municipios');
    },

    // SIMPLIFICADO: Sin fecha
    async getUserMunicipalities(userId) {
        return this.request(`/admin/usuarios/municipios?usuario_id=${userId}`);
    },

    async createUser(userData) {
        return this.request('/admin/usuarios/crear', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    async assignMunicipalities(assignmentData) {
        return this.request('/admin/usuarios/asignar-municipios', {
            method: 'POST',
            body: JSON.stringify(assignmentData)
        });
    }
};

// =============================================
// MÓDULO DE INTERFAZ DE USUARIO
// =============================================
const UI = {
    showTab(tabName, event) {
        document.querySelectorAll(SELECTORS.TABS.CONTAINER).forEach(tab => {
            tab.classList.remove('active');
        });
        
        document.querySelectorAll(SELECTORS.TABS.CONTENT).forEach(content => {
            content.classList.remove('active');
        });
        
        if (event?.target) {
            event.target.classList.add('active');
        }
        
        const targetContent = document.getElementById(tabName);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    },

    showNotification(message, type = 'success') {
        const notification = document.querySelector(SELECTORS.ELEMENTS.NOTIFICATION);
        if (!notification) return;

        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, CONFIG.NOTIFICATION_TIMEOUT);
    },

    clearForm(formSelector) {
        const form = document.querySelector(formSelector);
        form?.reset();
    },

    getSelectedCheckboxes(containerSelector) {
        const checkboxes = document.querySelectorAll(`${containerSelector} input:checked`);
        return Array.from(checkboxes).map(checkbox => parseInt(checkbox.value));
    },

    toggleAutocomplete(show = true) {
        const autocompleteList = document.querySelector(SELECTORS.ELEMENTS.AUTOCOMPLETE_USUARIOS);
        if (autocompleteList) {
            autocompleteList.classList.toggle('show', show);
        }
    },

    clearUserSelection() {
        document.querySelector(SELECTORS.ELEMENTS.BUSCAR_USUARIO).value = '';
        document.querySelector(SELECTORS.ELEMENTS.USUARIO_ASIGNACION_ID).value = '';
        document.querySelector(SELECTORS.ELEMENTS.USUARIO_SELECCIONADO_INFO).style.display = 'none';
        document.querySelector(SELECTORS.ELEMENTS.MUNICIPIOS_ASIGNADOS_INFO).textContent = '';
        
        this.clearMunicipalitySelection();
    },

    clearMunicipalitySelection() {
        document.querySelectorAll(`${SELECTORS.ELEMENTS.MUNICIPALITIES_CONTAINER} input:checked`)
            .forEach(checkbox => {
                checkbox.checked = false;
                const checkboxDiv = checkbox.closest('.municipio-checkbox');
                if (checkboxDiv) {
                    checkboxDiv.classList.remove('municipio-assigned');
                }
            });
        
        DataManager.updateMunicipalityCounter();
    }
};

// =============================================
// MÓDULO DE AUTCOMPLETADO
// =============================================
const AutocompleteManager = {
    init() {
        this.setupUserAutocomplete();
        this.setupClickOutside();
    },

    setupUserAutocomplete() {
        const input = document.querySelector(SELECTORS.ELEMENTS.BUSCAR_USUARIO);
        if (!input) return;

        const debouncedSearch = Utils.debounce((searchTerm) => {
            this.searchUsers(searchTerm);
        }, 300);

        input.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim();
            
            if (searchTerm.length === 0) {
                UI.toggleAutocomplete(false);
                UI.clearUserSelection();
                return;
            }

            if (searchTerm.length < 2) {
                UI.toggleAutocomplete(false);
                return;
            }

            debouncedSearch(searchTerm);
        });

        input.addEventListener('keydown', (e) => {
            this.handleKeyboardNavigation(e);
        });
    },

    setupClickOutside() {
        document.addEventListener('click', (e) => {
            const autocompleteContainer = document.querySelector('.autocomplete-container');
            const input = document.querySelector(SELECTORS.ELEMENTS.BUSCAR_USUARIO);
            
            if (!autocompleteContainer?.contains(e.target) && e.target !== input) {
                UI.toggleAutocomplete(false);
            }
        });
    },

    searchUsers(searchTerm) {
        if (!allUsers || allUsers.length === 0) return;

        const filteredUsers = allUsers.filter(usuario => 
            usuario.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            usuario.rol_nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );

        this.renderAutocompleteResults(filteredUsers);
    },

    renderAutocompleteResults(users) {
        const container = document.querySelector(SELECTORS.ELEMENTS.AUTOCOMPLETE_USUARIOS);
        if (!container) return;

        container.innerHTML = '';

        if (users.length === 0) {
            container.innerHTML = '<div class="autocomplete-item">No se encontraron usuarios</div>';
            UI.toggleAutocomplete(true);
            return;
        }

        users.slice(0, 10).forEach(usuario => {
            const item = this.createAutocompleteItem(usuario);
            container.appendChild(item);
        });

        UI.toggleAutocomplete(true);
    },

    createAutocompleteItem(usuario) {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.innerHTML = `
            <span class="username">${usuario.username}</span>
            <span class="role">${usuario.rol_nombre}</span>
        `;

        item.addEventListener('click', () => {
            this.selectUser(usuario);
        });

        return item;
    },

    async selectUser(usuario) {
        const input = document.querySelector(SELECTORS.ELEMENTS.BUSCAR_USUARIO);
        const userIdInput = document.querySelector(SELECTORS.ELEMENTS.USUARIO_ASIGNACION_ID);
        const userInfo = document.querySelector(SELECTORS.ELEMENTS.USUARIO_SELECCIONADO_INFO);
        const userName = document.querySelector(SELECTORS.ELEMENTS.USUARIO_SELECCIONADO_NOMBRE);
        const userRole = document.querySelector(SELECTORS.ELEMENTS.USUARIO_SELECCIONADO_ROL);

        input.value = usuario.username;
        userIdInput.value = usuario.id;
        userName.textContent = usuario.username;
        userRole.textContent = `(${usuario.rol_nombre})`;
        userInfo.style.display = 'block';

        UI.toggleAutocomplete(false);

        await this.loadUserMunicipalities(usuario.id);
    },

    async loadUserMunicipalities(userId) {
        try {
            const municipiosAsignados = await ApiService.getUserMunicipalities(userId);
            userMunicipalities.set(userId, municipiosAsignados);
            
            const assignedIds = municipiosAsignados.map(m => m.id);
            
            // Actualizar lista de municipios ordenada
            DataManager.renderMunicipalities(allMunicipalities, assignedIds);
            
            const infoElement = document.querySelector(SELECTORS.ELEMENTS.MUNICIPIOS_ASIGNADOS_INFO);
            if (municipiosAsignados.length > 0) {
                infoElement.textContent = `${municipiosAsignados.length} municipios asignados`;
            } else {
                infoElement.textContent = 'Sin municipios asignados';
            }
            
        } catch (error) {
            console.error('Error cargando municipios del usuario:', error);
            UI.showNotification('Error cargando municipios asignados: ' + error.message, 'error');
        }
    },



    handleKeyboardNavigation(e) {
        const items = document.querySelectorAll('.autocomplete-item');
        const currentFocus = document.querySelector('.autocomplete-item.active');
        let index = Array.from(items).indexOf(currentFocus);

        switch(e.key) {
            case 'ArrowDown':
                e.preventDefault();
                index = (index + 1) % items.length;
                break;
            case 'ArrowUp':
                e.preventDefault();
                index = (index - 1 + items.length) % items.length;
                break;
            case 'Enter':
                e.preventDefault();
                if (currentFocus) {
                    currentFocus.click();
                }
                return;
            case 'Escape':
                UI.toggleAutocomplete(false);
                return;
            default:
                return;
        }

        items.forEach(item => item.classList.remove('active'));
        if (items[index]) {
            items[index].classList.add('active');
        }
    }
};

// =============================================
// MÓDULO DE FILTRADO
// =============================================
const FilterManager = {
    init() {
        this.setupUserFilter();
        this.setupMunicipalityFilter();
    },

    setupUserFilter() {
        const filterInput = document.querySelector(SELECTORS.FILTERS.USUARIOS);
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.filterUsers(e.target.value);
            });
        }
    },

    setupMunicipalityFilter() {
        const filterInput = document.querySelector(SELECTORS.FILTERS.MUNICIPIOS);
        if (filterInput) {
            filterInput.addEventListener('input', (e) => {
                this.filterMunicipalities(e.target.value);
            });
        }
    },

    filterUsers(searchTerm) {
        if (!allUsers || allUsers.length === 0) return;
        
        const filteredUsers = allUsers.filter(usuario => {
            const usernameMatch = usuario.username?.toLowerCase().includes(searchTerm.toLowerCase());
            const roleMatch = usuario.rol_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
            return usernameMatch || roleMatch;
        });
        
        DataManager.renderUsers(filteredUsers);
        DataManager.updateUserCounter(filteredUsers.length);
    },

    filterMunicipalities(searchTerm) {
        const container = document.querySelector(SELECTORS.ELEMENTS.MUNICIPALITIES_CONTAINER);
        if (!container) return;

        const checkboxes = container.querySelectorAll('.municipio-checkbox');
        let visibleCount = 0;

        checkboxes.forEach(checkbox => {
            const label = checkbox.querySelector('label');
            if (!label) return;

            const matches = label.textContent.toLowerCase().includes(searchTerm.toLowerCase());
            checkbox.style.display = matches ? 'flex' : 'none';
            
            if (matches) visibleCount++;
        });

        let noResults = container.querySelector('.no-results');
        if (visibleCount === 0 && searchTerm !== '') {
            if (!noResults) {
                noResults = document.createElement('div');
                noResults.className = 'no-results';
                noResults.textContent = 'No se encontraron municipios';
                container.appendChild(noResults);
            }
            noResults.style.display = 'block';
        } else if (noResults) {
            noResults.style.display = 'none';
        }
    }


};

// =============================================
// MÓDULO DE GESTIÓN DE DATOS
// =============================================
const DataManager = {
    async loadRoles() {
        try {
            const roles = await ApiService.getRoles();
            this.renderRoles(roles);
        } catch (error) {
            UI.showNotification('Error cargando roles: ' + error.message, 'error');
        }
    },

    renderRoles(roles) {
        const select = document.querySelector(SELECTORS.ELEMENTS.ROLE_SELECT);
        if (!select) return;

        select.innerHTML = '<option value="">Seleccionar rol</option>';
        
        roles.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.id;
            option.textContent = rol.nombre;
            select.appendChild(option);
        });
    },

    async loadUsers() {
        try {
            allUsers = await ApiService.getUsers();
            this.renderUsers(allUsers);
            this.updateUserCounter(allUsers.length);
        } catch (error) {
            UI.showNotification('Error cargando usuarios: ' + error.message, 'error');
        }
    },

    renderUsers(usuarios) {
        const tbody = document.querySelector(SELECTORS.ELEMENTS.USER_LIST);
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: var(--gray);">
                        No se encontraron usuarios
                    </td>
                </tr>
            `;
            return;
        }

        usuarios.forEach(usuario => {
            const row = this.createUserRow(usuario);
            tbody.appendChild(row);
        });
    },

    createUserRow(usuario) {
        const row = document.createElement('tr');
        
        const statusClass = usuario.activo ? 'status-active' : 'status-inactive';
        const statusText = usuario.activo ? 'Activo' : 'Inactivo';
        
        const roleName = usuario.rol_nombre || 'Sin rol';
        const roleClass = roleName.toLowerCase() === 'admin' ? 'role-admin' : 'role-user';
        
        row.innerHTML = `
            <td>
                <strong>${usuario.username || 'N/A'}</strong>
            </td>
            <td>
                <span class="role-badge ${roleClass}">${roleName}</span>
            </td>
            <td>
                <span class="status-badge ${statusClass}">${statusText}</span>
            </td>
            <td>${this.formatDate(usuario.fecha_creacion)}</td>
        `;
        
        return row;
    },

    updateUserCounter(count) {
        const counter = document.querySelector(SELECTORS.ELEMENTS.TOTAL_USUARIOS);
        if (counter) {
            counter.textContent = count;
        }
    },

    async loadMunicipalities() {
        try {
            allMunicipalities = await ApiService.getMunicipalities();
            this.renderMunicipalities(allMunicipalities);
            this.setupMunicipalityCounter();
        } catch (error) {
            UI.showNotification('Error cargando municipios: ' + error.message, 'error');
        }
    },

    renderMunicipalities(municipios, assignedIds = []) {
        const container = document.querySelector(SELECTORS.ELEMENTS.MUNICIPALITIES_CONTAINER);
        if (!container) return;

        container.innerHTML = '';

        if (!municipios || municipios.length === 0) {
            container.innerHTML = '<div class="no-results">No hay municipios disponibles</div>';
            return;
        }

        // Ordenar municipios: asignados primero
        const sortedMunicipios = this.sortMunicipalities(municipios, assignedIds);
        
        sortedMunicipios.forEach(municipio => {
            const isAssigned = assignedIds.includes(municipio.id);
            const checkboxDiv = this.createMunicipalityCheckbox(municipio, isAssigned);
            container.appendChild(checkboxDiv);
        });
    },

    sortMunicipalities(municipios, assignedIds) {
        return [...municipios].sort((a, b) => {
            const aAssigned = assignedIds.includes(a.id);
            const bAssigned = assignedIds.includes(b.id);
            
            if (aAssigned && !bAssigned) return -1; // a primero
            if (!aAssigned && bAssigned) return 1;  // b primero
            return a.nombre.localeCompare(b.nombre); // orden alfabético
        });
    },

    createMunicipalityCheckbox(municipio, isAssigned = false) {
        const div = document.createElement('div');
        div.className = `municipio-checkbox ${isAssigned ? 'municipio-assigned' : ''}`;
        
        div.innerHTML = `
            <input type="checkbox" id="municipio-${municipio.id}" value="${municipio.id}" ${isAssigned ? 'checked' : ''}>
            <label for="municipio-${municipio.id}">${municipio.nombre}</label>
        `;
        
        return div;
    },

    setupMunicipalityCounter() {
        const container = document.querySelector(SELECTORS.ELEMENTS.MUNICIPALITIES_CONTAINER);
        const counter = document.querySelector(SELECTORS.ELEMENTS.CONTADOR_MUNICIPIOS);
        
        if (!container || !counter) return;

        const updateCounter = () => {
            const selectedCount = UI.getSelectedCheckboxes(SELECTORS.ELEMENTS.MUNICIPALITIES_CONTAINER).length;
            counter.textContent = `${selectedCount} seleccionados`;
        };

        updateCounter();

        container.addEventListener('change', updateCounter);
    },

    updateMunicipalityCounter() {
        const counter = document.querySelector(SELECTORS.ELEMENTS.CONTADOR_MUNICIPIOS);
        if (counter) {
            const selectedCount = UI.getSelectedCheckboxes(SELECTORS.ELEMENTS.MUNICIPALITIES_CONTAINER).length;
            counter.textContent = `${selectedCount} seleccionados`;
        }
    },

    formatDate(dateString) {
        if (!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES');
        } catch (error) {
            return 'N/A';
        }
    }
};

// =============================================
// MÓDULO DE GESTIÓN DE FORMULARIOS (SIMPLIFICADO)
// =============================================
const FormHandler = {
    init() {
        this.setupCreateUserForm();
    },

    setupCreateUserForm() {
        const form = document.querySelector(SELECTORS.FORMS.CREATE_USER);
        form?.addEventListener('submit', this.handleCreateUser.bind(this));
    },

    async handleCreateUser(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const rol_id = document.getElementById('rol').value;
        
        const usuario = {
            username: username.trim(),
            password: password,
            rol_id: parseInt(rol_id)
        };
        
        const errors = Validator.validateUserForm(usuario);
        if (errors.length > 0) {
            UI.showNotification(errors[0], 'error');
            return;
        }
        
        try {
            await ApiService.createUser(usuario);
            UI.showNotification('Usuario creado exitosamente', 'success');
            UI.clearForm(SELECTORS.FORMS.CREATE_USER);
            await DataManager.loadUsers();
        } catch (error) {
            UI.showNotification('Error creando usuario: ' + error.message, 'error');
        }
    },

    async handleMunicipalityAssignment() {
        const usuarioId = document.querySelector(SELECTORS.ELEMENTS.USUARIO_ASIGNACION_ID)?.value;
        const municipiosSeleccionados = UI.getSelectedCheckboxes(
            SELECTORS.ELEMENTS.MUNICIPALITIES_CONTAINER
        );
        
        const errors = Validator.validateAssignmentForm(usuarioId, municipiosSeleccionados);
        if (errors.length > 0) {
            UI.showNotification(errors[0], 'error');
            return;
        }
        
        const asignacion = {
            usuario_id: parseInt(usuarioId),
            municipios_ids: municipiosSeleccionados
        };
        
        try {
            await ApiService.assignMunicipalities(asignacion);
            UI.showNotification('Municipios asignados exitosamente', 'success');
            
            // Actualizar cache
            const municipiosAsignados = allMunicipalities.filter(m => 
                municipiosSeleccionados.includes(m.id)
            );
            userMunicipalities.set(parseInt(usuarioId), municipiosAsignados);
            
        } catch (error) {
            UI.showNotification('Error asignando municipios: ' + error.message, 'error');
        }
    }
};

// =============================================
// MÓDULO DE VALIDACIÓN (SIMPLIFICADO)
// =============================================
const Validator = {
    validateUserForm(formData) {
        const errors = [];
        
        if (Utils.isEmpty(formData.username)) {
            errors.push('El nombre de usuario es requerido');
        }
        
        if (Utils.isEmpty(formData.password)) {
            errors.push('La contraseña es requerida');
        }
        
        if (Utils.isEmpty(formData.rol_id)) {
            errors.push('Debe seleccionar un rol');
        }
        
        return errors;
    },

    // SIMPLIFICADO: Sin fecha
    validateAssignmentForm(usuarioId, municipiosSeleccionados) {
        const errors = [];
        
        if (Utils.isEmpty(usuarioId)) {
            errors.push('Debe seleccionar un usuario');
        }
        
        if (municipiosSeleccionados.length === 0) {
            errors.push('Debe seleccionar al menos un municipio');
        }
        
        return errors;
    }
};

// =============================================
// UTILIDADES
// =============================================
const Utils = {
    formatDate(date = new Date()) {
        return date.toISOString().split('T')[0];
    },

    createElement(tag, attributes = {}, content = '') {
        const element = document.createElement(tag);
        
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else {
                element.setAttribute(key, value);
            }
        });
        
        if (content) {
            element.innerHTML = content;
        }
        
        return element;
    },

    isEmpty(value) {
        return value === null || value === undefined || value === '';
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// =============================================
// FUNCIONES GLOBALES
// =============================================
function showTab(tabName) {
    UI.showTab(tabName, event);
}

async function asignarMunicipios() {
    await FormHandler.handleMunicipalityAssignment();
}

function logout() {
    localStorage.removeItem('userSession');
    window.location.href = '/front';
}

// =============================================
// INICIALIZACIÓN
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Inicializar sistemas
        FilterManager.init();
        AutocompleteManager.init();
        
        // Cargar datos
        await DataManager.loadRoles();
        await DataManager.loadUsers();
        await DataManager.loadMunicipalities();
        
        FormHandler.init();
        
        console.log('✅ Sistema de administración inicializado correctamente');
    } catch (error) {
        console.error('❌ Error inicializando la aplicación:', error);
        UI.showNotification('Error inicializando la aplicación: ' + error.message, 'error');
    }
});