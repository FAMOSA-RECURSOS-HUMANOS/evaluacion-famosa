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

    document.getElementById("metricaTotal").textContent = data.totalGeneral;
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
    filas += `
      <tr>
        <td>${p.nombre}</td>
        <td>${p.cargo}</td>
        <td>${p.area}</td>
        <td>${p.tipoPersonal}</td>
        <td>${badge}</td>
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
        </tr>
      </thead>
      <tbody>
        ${filas}
      </tbody>
    </table>
  `;
}

document.getElementById("buscarPersonal").addEventListener("input", renderizarListaPersonal);
document.getElementById("filtroArea").addEventListener("change", renderizarListaPersonal);
document.getElementById("filtroEstado").addEventListener("change", renderizarListaPersonal);
