const municipioSelect = document.getElementById('municipioSelect');
const localidadSelect = document.getElementById('localidadSelect');
const yearInput = document.getElementById('yearInput');
const actoInput = document.getElementById('actoInput');
const oficialiaInput = document.getElementById('oficialiaInput');
const numActaInput = document.getElementById('numActaInput');
const buscarBtn = document.getElementById('buscarBtn');
const pdfViewer = document.getElementById('pdf-viewer');

const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const loader = document.getElementById("loader"); // 👈 referencia al loader

let pages = [];
let currentPage = 0;
let zoomLevel = 1;

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
  const id = municipioSelect.value;
  localidadSelect.innerHTML = '<option value="">Seleccione localidad</option>';
  if (!id) return;

  fetch(`${API_BASE}/localidades?idmunicipio=${id}`)
    .then(res => res.json())
    .then(data => {
      data.forEach(l => {
        const option = document.createElement('option');
        option.value = l.idlocalidades;
        option.textContent = l.idlocalidades + "-" + l.nombre;
        localidadSelect.appendChild(option);
      });
    });
});

// Buscar PDF y mostrar en visor
buscarBtn.addEventListener('click', async () => {
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

  // 👇 Mostrar loader inmediatamente al dar clic
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
    alert("Error al cargar el PDF");
  }
});

// Mostrar página reconstruida con tiles
function showPage(pageIndex) {
  if (pages.length === 0) {
    pdfViewer.innerHTML = "No hay imágenes para mostrar";
    loader.style.display = "none";
    return;
  }

  const page = pages[pageIndex];
  const tiles = page.tiles;

  let html = `<div style="position:relative; display:inline-block;">`;

  // Para saber cuando todas las imágenes se carguen
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
        onload="imageLoaded()"  <!-- 👈 cuando cada imagen termine -->
      />
    `;
  });

  html += `</div>`;
  pdfViewer.innerHTML = html;
  pdfViewer.style.transform = `scale(${zoomLevel})`;

  updateNavigationButtons();

  // 👇 Contador de imágenes cargadas
  window.imageLoaded = function() {
    imagesLoaded++;
    if (imagesLoaded === tiles.length) {
      loader.style.display = "none"; // Ocultar loader solo cuando todas cargaron
    }
  };
}

// Actualizar visibilidad de botones
function updateNavigationButtons() {
  if (pages.length <= 1) {
    prevBtn.classList.add("hidden");
    nextBtn.classList.add("hidden");
    return;
  }

  if (currentPage === 0) {
    prevBtn.classList.add("hidden");
  } else {
    prevBtn.classList.remove("hidden");
  }

  if (currentPage === pages.length - 1) {
    nextBtn.classList.add("hidden");
  } else {
    nextBtn.classList.remove("hidden");
  }
}

// Controles de navegación
prevBtn.addEventListener("click", () => {
  if (currentPage > 0) {
    currentPage--;
    loader.style.display = "block"; // 👈 mostrar loader al cambiar página
    showPage(currentPage);
  }
});

nextBtn.addEventListener("click", () => {
  if (currentPage < pages.length - 1) {
    currentPage++;
    loader.style.display = "block"; // 👈 mostrar loader al cambiar página
    showPage(currentPage);
  }
});

// Controles de zoom
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
