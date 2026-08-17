const API_URL = "https://script.google.com/macros/s/AKfycbxwoFz1ZCIVLr3QoJPCd8jB1-HyE2SRH4nCj5JgKkc8lJX2W1H--h9UwYZQyGl8qi41/exec";

function manejarLogin(respuesta) {
  const idToken = respuesta.credential;

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ tipo: "verificarLogin", idToken: idToken })
  })
  .then(res => res.json())
  .then(data => {
    if (data.autorizado) {
      // Guardamos el token en esta sesión del navegador (se borra al cerrar pestaña)
      sessionStorage.setItem("rrhh_idToken", idToken);
      sessionStorage.setItem("rrhh_nombre", data.nombre || data.email);

      document.getElementById("pantallaLogin").classList.add("oculto");
      document.getElementById("pantallaPanel").classList.remove("oculto");
      document.getElementById("nombreUsuario").textContent = data.nombre || data.email;
      cargarDashboard();  
    } else {
      document.getElementById("mensajeError").textContent =
        "Acceso no autorizado: " + (data.motivo || "correo no reconocido");
    }
  })
  .catch(err => {
    document.getElementById("mensajeError").textContent = "Error al verificar acceso: " + err.message;
  });
}

function cerrarSesion() {
  sessionStorage.removeItem("rrhh_idToken");
  sessionStorage.removeItem("rrhh_nombre");
  location.reload();
}

// Si ya había una sesión activa (por ejemplo, recargaste la página), la restauramos
window.addEventListener("DOMContentLoaded", () => {
  const tokenGuardado = sessionStorage.getItem("rrhh_idToken");
  const nombreGuardado = sessionStorage.getItem("rrhh_nombre");
  if (tokenGuardado) {
    document.getElementById("pantallaLogin").classList.add("oculto");
    document.getElementById("pantallaPanel").classList.remove("oculto");
    document.getElementById("nombreUsuario").textContent = nombreGuardado || "";
    cargarDashboard();
  }
});

function cargarDashboard() {
  cargarListaPersonal();
  cargarRanking();
  const idToken = sessionStorage.getItem("rrhh_idToken");

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ tipo: "dashboard", idToken: idToken })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.ok) {
      document.getElementById("tablaAreas").innerHTML =
        "<p style='text-align:center; color:#B30000;'>Error: " + (data.error || "No se pudo cargar el dashboard") + "</p>";
      return;
    }

    document.getElementById("metricaTotalPersonal").textContent = data.totalPersonalGeneral;
    document.getElementById("metricaAplican").textContent = data.aplicanEvaluacion;
    document.getElementById("metricaNoAplican").textContent = data.noAplicanEvaluacion;

    document.getElementById("metricaEvaluados").textContent = data.evaluadosGeneral;
    document.getElementById("metricaPendientes").textContent = data.pendientesGeneral;
    document.getElementById("metricaPorcentaje").textContent = data.porcentajeGeneral + "%";

    let filas = "";
    data.areas.forEach(a => {
      filas += `
        <tr>
          <td>${a.area}</td>
          <td>${a.total}</td>
          <td>${a.evaluados}</td>
          <td>${a.pendientes}</td>
          <td style="width:150px;">
            <div class="barra-progreso">
              <div class="barra-progreso-relleno" style="width:${a.porcentaje}%;"></div>
            </div>
          </td>
          <td>${a.porcentaje}%</td>
        </tr>
      `;
    });

    document.getElementById("tablaAreas").innerHTML = `
      <table class="tabla-dashboard">
        <thead>
          <tr>
            <th>Área</th>
            <th>Total</th>
            <th>Evaluados</th>
            <th>Pendientes</th>
            <th>Progreso</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    `;
  })
  .catch(err => {
    document.getElementById("tablaAreas").innerHTML =
      "<p style='text-align:center; color:#B30000;'>Error al cargar: " + err.message + "</p>";
  });
}

let personalCompleto = [];

function cargarListaPersonal() {
  const idToken = sessionStorage.getItem("rrhh_idToken");

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ tipo: "listaPersonal", idToken: idToken })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.ok) {
      document.getElementById("listaPersonalContainer").innerHTML =
        "<p style='text-align:center; color:#B30000;'>Error: " + (data.error || "No se pudo cargar la lista") + "</p>";
      return;
    }

    personalCompleto = data.personal;

    const areas = [...new Set(personalCompleto.map(p => p.area))].sort();
    const selectArea = document.getElementById("filtroArea");
    areas.forEach(area => {
      const opt = document.createElement("option");
      opt.value = area;
      opt.textContent = area;
      selectArea.appendChild(opt);
    });

    renderizarListaPersonal();
  })
  .catch(err => {
    document.getElementById("listaPersonalContainer").innerHTML =
      "<p style='text-align:center; color:#B30000;'>Error al cargar: " + err.message + "</p>";
  });
}

function renderizarListaPersonal() {
  const busqueda = document.getElementById("buscarPersonal").value.trim().toUpperCase();
  const areaFiltro = document.getElementById("filtroArea").value;
  const estadoFiltro = document.getElementById("filtroEstado").value;

  let filtrados = personalCompleto.filter(p => {
    const coincideBusqueda = !busqueda || p.nombre.toUpperCase().includes(busqueda);
    const coincideArea = !areaFiltro || p.area === areaFiltro;
    const coincideEstado =
      !estadoFiltro ||
      (estadoFiltro === "evaluado" && p.evaluado) ||
      (estadoFiltro === "pendiente" && !p.evaluado);
    return coincideBusqueda && coincideArea && coincideEstado;
  });

  if (filtrados.length === 0) {
    document.getElementById("listaPersonalContainer").innerHTML =
      "<p style='text-align:center; color:#666;'>No se encontraron resultados.</p>";
    return;
  }

  let filas = "";
  filtrados.forEach(p => {
    const badge = p.evaluado
      ? '<span class="badge-evaluado">Evaluado</span>'
      : '<span class="badge-pendiente">Pendiente</span>';
    const nombreEscapado = p.nombre.replace(/'/g, "\\'");
    const cargoEscapado = (p.cargo || "").replace(/'/g, "\\'");
    const botonPdf = p.evaluado
      ? `<button class="btn-pdf" onclick="generarPDFPersona('${nombreEscapado}', '${cargoEscapado}', this)">Generar PDF</button>`
      : `<button class="btn-pdf" disabled title="Aún no evaluado">Generar PDF</button>`;
    filas += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.cargo}</td>
        <td>${p.area}</td>
        <td>${p.tipoPersonal}</td>
        <td>${badge}</td>
        <td>${botonPdf}</td>
      </tr>
    `;
  });

  document.getElementById("listaPersonalContainer").innerHTML = `
    <p style="color:#666; font-size:13px; margin-bottom:8px;">${filtrados.length} de ${personalCompleto.length} personas</p>
    <table class="tabla-dashboard">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cargo</th>
          <th>Área</th>
          <th>Tipo</th>
          <th>Estado</th>
          <th>PDF</th>
        </tr>
      </thead>
      <tbody>
        ${filas}
      </tbody>
    </table>
  `;
}

// ==================== GENERAR PDF (descarga directa al navegador) ====================
function generarPDFPersona(nombre, cargo, boton) {
  const idToken = sessionStorage.getItem("rrhh_idToken");
  const textoOriginal = boton.textContent;
  boton.textContent = "Generando...";
  boton.disabled = true;

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ tipo: "generarPDF", idToken: idToken, evaluado: nombre, cargoEvaluado: cargo })
  })
  .then(res => res.json())
  .then(data => {
    if (data.ok && data.pdfBase64) {
      // Convertir el base64 recibido en un archivo real y forzar la descarga
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const urlTemporal = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = urlTemporal;
      enlace.download = data.filename || "Evaluacion.pdf";
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(urlTemporal);

      boton.textContent = "Descargado ✓";
      setTimeout(() => {
        boton.textContent = textoOriginal;
        boton.disabled = false;
      }, 2500);
    } else {
      alert("Error al generar el PDF: " + (data.error || "desconocido"));
      boton.textContent = textoOriginal;
      boton.disabled = false;
    }
  })
  .catch(err => {
    alert("Error de conexión: " + err.message);
    boton.textContent = textoOriginal;
    boton.disabled = false;
  });
}

// ==================== SELECTOR DE VISTA: ANUAL / TRIMESTRAL ====================
let trimestralCargado = false;

function mostrarVista(tipo) {
  const tabAnual = document.getElementById("tabAnual");
  const tabTrimestral = document.getElementById("tabTrimestral");
  const vistaAnual = document.getElementById("vistaAnual");
  const vistaTrimestral = document.getElementById("vistaTrimestral");

  if (tipo === "anual") {
    vistaAnual.classList.remove("oculto");
    vistaTrimestral.classList.add("oculto");
    tabAnual.style.background = "#B30000";
    tabTrimestral.style.background = "#888";
  } else {
    vistaAnual.classList.add("oculto");
    vistaTrimestral.classList.remove("oculto");
    tabAnual.style.background = "#888";
    tabTrimestral.style.background = "#B30000";
    if (!trimestralCargado) {
      cargarListaTrimestral();
      trimestralCargado = true;
    }
  }
}

// ==================== LISTA DE PERSONAL - TRIMESTRAL ====================
let trimestralCompleto = [];

function cargarListaTrimestral() {
  const idToken = sessionStorage.getItem("rrhh_idToken");

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ tipo: "listaTrimestral", idToken: idToken })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.ok) {
      document.getElementById("listaTrimestralContainer").innerHTML =
        "<p style='text-align:center; color:#B30000;'>Error: " + (data.error || "No se pudo cargar la lista") + "</p>";
      return;
    }

    trimestralCompleto = data.lista;
    renderizarListaTrimestral();
  })
  .catch(err => {
    document.getElementById("listaTrimestralContainer").innerHTML =
      "<p style='text-align:center; color:#B30000;'>Error al cargar: " + err.message + "</p>";
  });
}

function etiquetaRecomendacion(valor) {
  if (valor === "SEGUIR") return '<span class="badge-evaluado">Seguir Contrato</span>';
  if (valor === "RESCINDIR") return '<span class="badge-pendiente">Rescindir Contrato</span>';
  if (valor === "CAPACITAR") return '<span style="background:#D4A017; color:white; padding:4px 10px; border-radius:12px; font-size:12px; font-weight:bold;">Capacitar</span>';
  return '<span style="color:#888;">Sin definir</span>';
}

function renderizarListaTrimestral() {
  const busqueda = document.getElementById("buscarTrimestral").value.trim().toUpperCase();
  const recFiltro = document.getElementById("filtroRecomendacion").value;

  let filtrados = trimestralCompleto.filter(p => {
    const coincideBusqueda = !busqueda || p.nombre.toUpperCase().includes(busqueda);
    const coincideRec = !recFiltro || p.recomendacion === recFiltro;
    return coincideBusqueda && coincideRec;
  });

  if (filtrados.length === 0) {
    document.getElementById("listaTrimestralContainer").innerHTML =
      "<p style='text-align:center; color:#666;'>No se encontraron evaluaciones trimestrales.</p>";
    return;
  }

  let filas = "";
  filtrados.forEach(p => {
    const nombreEscapado = p.nombre.replace(/'/g, "\\'");
    const botonPdf = `<button class="btn-pdf" onclick="generarPDFTrimestral('${nombreEscapado}', this)">Generar PDF</button>`;
    filas += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.cargo}</td>
        <td>${p.area}</td>
        <td>${p.fechaLlenado || "-"}</td>
        <td>${p.promedioTotal !== null ? p.promedioTotal + "%" : "-"}</td>
        <td>${etiquetaRecomendacion(p.recomendacion)}</td>
        <td>${botonPdf}</td>
      </tr>
    `;
  });

  document.getElementById("listaTrimestralContainer").innerHTML = `
    <p style="color:#666; font-size:13px; margin-bottom:8px;">${filtrados.length} de ${trimestralCompleto.length} evaluaciones</p>
    <table class="tabla-dashboard">
      <thead>
        <tr>
          <th>Nombre</th>
          <th>Cargo</th>
          <th>Área</th>
          <th>Fecha</th>
          <th>Promedio</th>
          <th>Recomendación</th>
          <th>PDF</th>
        </tr>
      </thead>
      <tbody>
        ${filas}
      </tbody>
    </table>
  `;
}

function generarPDFTrimestral(nombre, boton) {
  const idToken = sessionStorage.getItem("rrhh_idToken");
  const textoOriginal = boton.textContent;
  boton.textContent = "Generando...";
  boton.disabled = true;

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ tipo: "generarPDFTrimestral", idToken: idToken, evaluado: nombre })
  })
  .then(res => res.json())
  .then(data => {
    if (data.ok && data.pdfBase64) {
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });

      const urlTemporal = URL.createObjectURL(blob);
      const enlace = document.createElement("a");
      enlace.href = urlTemporal;
      enlace.download = data.filename || "Trimestral.pdf";
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(urlTemporal);

      boton.textContent = "Descargado ✓";
      setTimeout(() => {
        boton.textContent = textoOriginal;
        boton.disabled = false;
      }, 2500);
    } else {
      alert("Error al generar el PDF: " + (data.error || "desconocido"));
      boton.textContent = textoOriginal;
      boton.disabled = false;
    }
  })
  .catch(err => {
    alert("Error de conexión: " + err.message);
    boton.textContent = textoOriginal;
    boton.disabled = false;
  });
}

document.getElementById("buscarTrimestral").addEventListener("input", renderizarListaTrimestral);
document.getElementById("filtroRecomendacion").addEventListener("change", renderizarListaTrimestral);

// ==================== TOP 10 COLABORADORES (RANKING GENERAL) ====================
function cargarRanking() {
  const idToken = sessionStorage.getItem("rrhh_idToken");

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({ tipo: "ranking", idToken: idToken })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.ok) {
      document.getElementById("rankingContainer").innerHTML =
        "<p style='text-align:center; color:#B30000;'>Error: " + (data.error || "No se pudo cargar el ranking") + "</p>";
      return;
    }

    if (data.ranking.length === 0) {
      document.getElementById("rankingContainer").innerHTML =
        "<p style='text-align:center; color:#666;'>Aún no hay evaluaciones completas para generar el ranking.</p>";
      return;
    }

    const medallas = ["🥇", "🥈", "🥉"];
    let filas = "";
    data.ranking.forEach((p, index) => {
      const posicion = medallas[index] || (index + 1) + "º";
      filas += `
        <tr>
          <td style="font-size:18px; text-align:center;">${posicion}</td>
          <td>${p.nombre}</td>
          <td>${p.cargo}</td>
          <td>${p.area}</td>
          <td style="font-weight:bold; color:#B30000;">${p.calificacionIntegral} / 5</td>
        </tr>
      `;
    });

    document.getElementById("rankingContainer").innerHTML = `
      <table class="tabla-dashboard">
        <thead>
          <tr>
            <th>#</th>
            <th>Nombre</th>
            <th>Cargo</th>
            <th>Área</th>
            <th>Calificación Integral</th>
          </tr>
        </thead>
        <tbody>
          ${filas}
        </tbody>
      </table>
    `;
  })
  .catch(err => {
    document.getElementById("rankingContainer").innerHTML =
      "<p style='text-align:center; color:#B30000;'>Error al cargar: " + err.message + "</p>";
  });
}

document.getElementById("buscarPersonal").addEventListener("input", renderizarListaPersonal);
document.getElementById("filtroArea").addEventListener("change", renderizarListaPersonal);
document.getElementById("filtroEstado").addEventListener("change", renderizarListaPersonal);
