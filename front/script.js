const municipioSelect = document.getElementById('municipioSelect');
const localidadSelect = document.getElementById('localidadSelect');
const yearInput = document.getElementById('yearInput');
const actoInput = document.getElementById('actoInput');
const oficialiaInput = document.getElementById('oficialiaInput');
const numActaInput = document.getElementById('numActaInput');
const buscarBtn = document.getElementById('buscarBtn');
const pdfViewer = document.getElementById('pdfViewer');
let pages = [];
let currentPage = 0;

const API_BASE = "http://localhost:8080"; // tu backend

// Cargar municipios al inicio
fetch(`${API_BASE}/municipios`)
    .then(res => res.json())
    .then(data => {
        data.forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = m.nombre;
            municipioSelect.appendChild(option);
        });
    });

// Cargar localidades cuando se seleccione un municipio
municipioSelect.addEventListener('change', () => {
    console.log(municipioSelect.value);
    const id = municipioSelect.value;
    localidadSelect.innerHTML = '<option value="">Seleccione localidad</option>';
    if (!id) return;

    fetch(`${API_BASE}/localidades?idmunicipio=${id}`)
        .then(res => res.json())
        .then(data => {
            data.forEach(l => {
                const option = document.createElement('option');
                option.value = l.idlocalidades;
                option.textContent =l.idlocalidades  +"-"+ l.nombre ;
                localidadSelect.appendChild(option);
            });
        });
});

// Buscar PDF y mostrar en iframe
buscarBtn.addEventListener('click', async() => {
    const year = yearInput.value;
    const acto = actoInput.value;
    const municipio = municipioSelect.value;
    const oficialia = oficialiaInput.value;
    const localidad = localidadSelect.value;
    const numActa = numActaInput.value;

    if (!year || !acto || !municipio || !oficialia || !localidad || !numActa) {
        alert("Complete todos los campos.");
        return;
    }

    const url = `${API_BASE}/pdf?year=${year}&acto=${acto}&municipio=${municipio}&oficialia=${oficialia}&localidad=${localidad}&numActa=${numActa}`;
    
 const res = await fetch(url)
 const data = await res.json();
 
    pages = data.pages;
    currentPage = 0;
    showPage(currentPage);
});

// Mostrar una página reconstruida con tiles
function showPage(pageIndex) {
    const viewer = document.getElementById("pdf-viewer");

    if (pages.length === 0) {
        viewer.innerHTML = "No hay imágenes para mostrar";
        return;
    }

    const page = pages[pageIndex];
    const tiles = page.tiles;

    // Creamos un contenedor "canvas-like" usando posición absoluta
    let html = `<div style="position:relative; display:inline-block;">`;

    tiles.forEach(tile => {
        html += `
            <img 
              src="data:image/png;base64,${tile.image}" 
              style="
                position:absolute; 
                left:${tile.x}px; 
                top:${tile.y}px; 
                width:${tile.width}px; 
                height:${tile.height}px;
              "
            />
        `;
    });

    html += `</div>`;
    viewer.innerHTML = html;
}

document.getElementById("prev-page").addEventListener("click", () => {
    if(currentPage > 0) {
        currentPage--;
        showPage(currentPage);
    }
});

document.getElementById("next-page").addEventListener("click", () => {
    if(currentPage < pages.length - 1) {
        currentPage++;
        showPage(currentPage);
    }
});