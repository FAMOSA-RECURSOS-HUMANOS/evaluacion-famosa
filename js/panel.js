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
