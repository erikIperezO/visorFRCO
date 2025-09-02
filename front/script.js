const municipioSelect = document.getElementById('municipioSelect');
const municipioSearch = document.getElementById('municipioSearch');
const municipioDropdown = document.getElementById('municipioDropdown');

const localidadSelect = document.getElementById('localidadSelect');
const yearInput = document.getElementById('yearInput');
const actoInput = document.getElementById('actoInput');
const oficialiaInput = document.getElementById('oficialiaInput');
const numActaInput = document.getElementById('numActaInput');
const buscarBtn = document.getElementById('buscarBtn');
const pdfViewer = document.getElementById('pdf-viewer');

const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const loader = document.getElementById("loader");

let municipios = []; // se cargan desde backend
let pages = [];
let currentPage = 0;
let zoomLevel = 1;
var municipioSelected = 0;

const API_BASE = "http://localhost:8080";

// Cargar municipios desde backend
fetch(`${API_BASE}/municipios`)
  .then(res => res.json())
  .then(data => {
    municipios = data; // [{id, nombre}, ...]
  });

// Filtrar municipios conforme escribe
municipioSearch.addEventListener("input", () => {
  const value = municipioSearch.value.toLowerCase();
  municipioDropdown.innerHTML = "";
  if (!value) {
    municipioDropdown.style.display = "none";
    return;
  }

  const filtrados = municipios.filter(m => m.nombre.toLowerCase().includes(value));

  if (filtrados.length === 0) {
    municipioDropdown.style.display = "none";
    return;
  }

  filtrados.forEach(m => {
    const div = document.createElement("div");
    div.textContent = m.nombre;
    div.onclick = () => {
      municipioSearch.value = m.nombre;
      municipioSelect.value = m.id;
      municipioSelected = m.id;
      municipioDropdown.style.display = "none";
      cargarLocalidades(m.id);
    };
    municipioDropdown.appendChild(div);
  });

  municipioDropdown.style.display = "block";
});

// Cargar localidades de un municipio
function cargarLocalidades(idMunicipio) {
  localidadSelect.innerHTML = '<option value="">Seleccione localidad</option>';
  if (!idMunicipio) return;

  fetch(`${API_BASE}/localidades?idmunicipio=${idMunicipio}`)
    .then(res => res.json())
    .then(data => {
      data.forEach(l => {
        const option = document.createElement('option');
        option.value = l.idlocalidades;
        option.textContent = l.idlocalidades + "-" + l.nombre;
        localidadSelect.appendChild(option);
      });
    });
}

// Buscar PDF
buscarBtn.addEventListener('click', async () => {
  const year = yearInput.value;
  const acto = actoInput.value;
  const municipio = municipioSelected;
  const oficialia = oficialiaInput.value;
  const localidad = localidadSelect.value;
  const numActa = numActaInput.value;

  if (!year || !acto || !municipio || !oficialia || !localidad || !numActa) {
    alert("Complete todos los campos.");
    return;
  }

  loader.style.display = "block";
  pdfViewer.innerHTML = "";

  try {
    const url = `${API_BASE}/pdf?year=${year}&acto=${acto}&municipio=${municipio}&oficialia=${oficialia}&localidad=${localidad}&numActa=${numActa}`;
    const res = await fetch(url);
    const data = await res.json();

    pages = data.pages;
    currentPage = 0;
    zoomLevel = 1;
    showPage(currentPage);
  } catch (err) {
    loader.style.display = "none";
    alert("Acta no encontrada");
  }
});

// Mostrar página con tiles
function showPage(pageIndex) {
  if (pages.length === 0) {
    pdfViewer.innerHTML = "No hay imágenes para mostrar";
    loader.style.display = "none";
    return;
  }

  const page = pages[pageIndex];
  const tiles = page.tiles;

  let html = `<div style="position:relative; display:inline-block;">`;
  let imagesLoaded = 0;

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
        onload="imageLoaded()"
      />
    `;
  });

  html += `</div>`;
  pdfViewer.innerHTML = html;
  pdfViewer.style.transform = `scale(${zoomLevel})`;

  updateNavigationButtons();

  window.imageLoaded = function() {
    imagesLoaded++;
    if (imagesLoaded === tiles.length) {
      loader.style.display = "none";
    }
  };
}

// Actualizar botones
function updateNavigationButtons() {
  if (pages.length <= 1) {
    prevBtn.classList.add("hidden");
    nextBtn.classList.add("hidden");
    return;
  }
  (currentPage === 0) ? prevBtn.classList.add("hidden") : prevBtn.classList.remove("hidden");
  (currentPage === pages.length - 1) ? nextBtn.classList.add("hidden") : nextBtn.classList.remove("hidden");
}

// Navegación
prevBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    loader.style.display = "block";
    showPage(currentPage);
  }
});

nextBtn.addEventListener("click", () => {
  if (currentPage < pages.length - 1) {
    currentPage++;
    loader.style.display = "block";
    showPage(currentPage);
  }
});

// Zoom
document.getElementById("zoom-in").addEventListener("click", () => {
  zoomLevel += 0.2;
  pdfViewer.style.transform = `scale(${zoomLevel})`;
});

document.getElementById("zoom-out").addEventListener("click", () => {
  if (zoomLevel > 0.4) {
    zoomLevel -= 0.2;
    pdfViewer.style.transform = `scale(${zoomLevel})`;
  }
});

document.getElementById("reset-zoom").addEventListener("click", () => {
  zoomLevel = 1;
  pdfViewer.style.transform = `scale(${zoomLevel})`;
});
