const API_BASE = "http://localhost:8080/api";

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarRoles();
    cargarUsuarios();
    cargarMunicipios();
    document.getElementById('fechaAsignacion').value = new Date().toISOString().split('T')[0];
});

// Funciones de pestañas
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Cargar roles
async function cargarRoles() {
    try {
        const response = await fetch(`${API_BASE}/admin/roles`);
        const roles = await response.json();
        
        const select = document.getElementById('rol');
        select.innerHTML = '<option value="">Seleccionar rol</option>';
        roles.forEach(rol => {
            const option = document.createElement('option');
            option.value = rol.id;
            option.textContent = rol.nombre;
            select.appendChild(option);
        });
    } catch (error) {
        showNotification('Error cargando roles', 'error');
    }
}

// Cargar usuarios
async function cargarUsuarios() {
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios`);
        const usuarios = await response.json();
        
        const lista = document.getElementById('listaUsuarios');
        const select = document.getElementById('usuarioAsignacion');
        
        lista.innerHTML = '';
        select.innerHTML = '<option value="">Seleccionar usuario</option>';
        
        usuarios.forEach(usuario => {
            // Tarjeta de usuario
            const card = document.createElement('div');
            card.className = `user-card ${usuario.rol_nombre}`;
            card.innerHTML = `
                <h3>${usuario.username}</h3>
                <p><strong>Rol:</strong> ${usuario.rol_nombre}</p>
                <p><strong>Estado:</strong> ${usuario.activo ? 'Activo' : 'Inactivo'}</p>
            `;
            lista.appendChild(card);
            
            // Opción para select
            const option = document.createElement('option');
            option.value = usuario.id;
            option.textContent = `${usuario.username} (${usuario.rol_nombre})`;
            select.appendChild(option);
        });
    } catch (error) {
        showNotification('Error cargando usuarios', 'error');
    }
}

// Cargar municipios
async function cargarMunicipios() {
    try {
        const response = await fetch(`${API_BASE}/municipios`);
        const municipios = await response.json();
        
        const container = document.getElementById('municipiosDisponibles');
        container.innerHTML = '';
        
        municipios.forEach(municipio => {
            const div = document.createElement('div');
            div.className = 'municipio-checkbox';
            div.innerHTML = `
                <input type="checkbox" id="municipio-${municipio.id}" value="${municipio.id}">
                <label for="municipio-${municipio.id}" style="margin-left: 8px;">${municipio.nombre}</label>
            `;
            container.appendChild(div);
        });
    } catch (error) {
        showNotification('Error cargando municipios', 'error');
    }
}

// Crear usuario
document.getElementById('crearUsuarioForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const usuario = {
        username: document.getElementById('username').value,
        password: document.getElementById('password').value,
        rol_id: parseInt(document.getElementById('rol').value)
    };
    
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios/crear`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usuario)
        });
        
        if (response.ok) {
            showNotification('Usuario creado exitosamente', 'success');
            document.getElementById('crearUsuarioForm').reset();
            cargarUsuarios();
        } else {
            showNotification('Error creando usuario', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
});

// Asignar municipios
async function asignarMunicipios() {
    const usuarioId = document.getElementById('usuarioAsignacion').value;
    const fecha = document.getElementById('fechaAsignacion').value;
    
    if (!usuarioId || !fecha) {
        showNotification('Seleccione usuario y fecha', 'error');
        return;
    }
    
    const municipiosSeleccionados = [];
    document.querySelectorAll('#municipiosDisponibles input:checked').forEach(checkbox => {
        municipiosSeleccionados.push(parseInt(checkbox.value));
    });
    
    if (municipiosSeleccionados.length === 0) {
        showNotification('Seleccione al menos un municipio', 'error');
        return;
    }
    
    const asignacion = {
        usuario_id: parseInt(usuarioId),
        municipios_ids: municipiosSeleccionados,
        fecha_asignacion: fecha
    };
    
    try {
        const response = await fetch(`${API_BASE}/admin/usuarios/asignar-municipios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(asignacion)
        });
        
        if (response.ok) {
            showNotification('Municipios asignados exitosamente', 'success');
            // Limpiar selección
            document.querySelectorAll('#municipiosDisponibles input:checked').forEach(checkbox => {
                checkbox.checked = false;
            });
        } else {
            showNotification('Error asignando municipios', 'error');
        }
    } catch (error) {
        showNotification('Error de conexión', 'error');
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('userSession');
    window.location.href = '/';
}

// Función de notificación
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type}`;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}