// ======================
// 1. CONFIGURACIÓN API
// ======================
const API_URL = "https://script.google.com/macros/s/AKfycbxwoFz1ZCIVLr3QoJPCd8jB1-HyE2SRH4nCj5JgKkc8lJX2W1H--h9UwYZQyGl8qi41/exec";
let PERSONAL = [];
let COMPETENCIAS = [];
let FUNCIONES = [];

// ======================
// 2. CARGA DE DATOS SHEETS
// ======================
async function cargarPersonal() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    PERSONAL = data.personal;
    COMPETENCIAS = data.competencias;
    FUNCIONES = data.funciones;
    llenarSelects();
  } catch (error) {
    console.error("Error cargando datos:", error);
  }
}

// ======================
// 3. LLENAR SELECTS
// ======================
function llenarSelects() {
  const selects = document.querySelectorAll("select[id^='evaluador_'], select[id^='evaluado_']");
  selects.forEach(sel => {
    const esSelectorEvaluador = sel.id.startsWith("evaluador_");
    const listaFiltrada = PERSONAL.filter(p => {
      const valor = esSelectorEvaluador ? p["EVALUA"] : p["EVALUADO"];
      return String(valor || "").trim().toUpperCase() === "SI";
    });

    sel.innerHTML = "<option value=''>Seleccione</option>";
    listaFiltrada.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p["NOMBRE COMPLETO"];
      opt.textContent = p["NOMBRE COMPLETO"];
      sel.appendChild(opt);
    });
  });
}

// ======================
// 4. NAVEGACIÓN ENTRE PANTALLAS
// ======================
function ocultarTodo() {
  document.querySelectorAll(".card").forEach(sec => sec.classList.add("oculto"));
}

function mostrar(id) {
  ocultarTodo();
  document.getElementById(id).classList.remove("oculto");
}

function volverInicio() {
  ocultarTodo();
  document.getElementById("pantallaInicio").classList.remove("oculto");
}
// ======================
// 5. BOTÓN CONTINUAR (4 REALIDADES)
// ======================
function continuar() {
  const tipoPersonal = document.getElementById("tipoPersonal").value;
  const tipoEvaluacion = document.getElementById("tipoEvaluacion").value;

  if (tipoPersonal === "TERCIARIO" && tipoEvaluacion === "TRIMESTRAL") {
    mostrar("trim_terciario");
  } else if (tipoPersonal === "FAMOSA" && tipoEvaluacion === "TRIMESTRAL") {
    mostrar("trim_famosa");
  } else if (tipoPersonal === "FAMOSA" && tipoEvaluacion === "ANUAL") {
    mostrar("anual_famosa");
  } else if (tipoPersonal === "TERCIARIO" && tipoEvaluacion === "ANUAL") {
    mostrar("anual_terciario");
  } else {
    alert("Seleccione opciones válidas");
  }
}

// ======================
// 6. AUTO LLENADO DE CAMPOS
// ======================
function autoCompletar(nombre, sufijo, tipo) {
  const persona = PERSONAL.find(p => p["NOMBRE COMPLETO"] === nombre);
  if (!persona) return;

  if (tipo === "evaluador") {
    document.getElementById(`cargoEvaluador_${sufijo}`) &&
      (document.getElementById(`cargoEvaluador_${sufijo}`).value = persona["CARGO"] || "");
  }

  if (tipo === "evaluado") {
    document.getElementById(`cargoEvaluado_${sufijo}`) &&
      (document.getElementById(`cargoEvaluado_${sufijo}`).value = persona["CARGO"] || "");
    document.getElementById(`areaEvaluado_${sufijo}`) &&
      (document.getElementById(`areaEvaluado_${sufijo}`).value = persona["AREA"] || "");
    document.getElementById(`regionalEmp_${sufijo}`) &&
      (document.getElementById(`regionalEmp_${sufijo}`).value = persona["REGIONAL"] || "");
  }
}
// ======================
// 7. EVENTOS AUTOMÁTICOS
// ======================
document.addEventListener("change", (e) => {
  const id = e.target.id;

  if (id.startsWith("evaluador_")) {
    const sufijo = id.replace("evaluador_", "");
    autoCompletar(e.target.value, sufijo, "evaluador");
  }

  if (id.startsWith("evaluado_")) {
    const sufijo = id.replace("evaluado_", "");
    autoCompletar(e.target.value, sufijo, "evaluado");
  }
});

// ======================
// 8. INICIO
// ======================
window.onload = () => {
  cargarPersonal();
};
// ========================
// 9. TARJETAS DE ESCALA (PÁGINA 3)
// ========================
function crearTarjetaEscala(titulo, descripcion, nombreCampo, etiquetas, sufijo) {
  const opciones = etiquetas.map(op => `
    <div class="opcion-escala" data-valor="${op.valor}" onclick="seleccionarOpcion(this, '${nombreCampo}', '${sufijo || ""}')">
      <span class="numero">${op.valor}</span>
      <span class="etiqueta">${op.texto}</span>
    </div>
  `).join("");

  return `
    <div class="pregunta-card">
      <h4>${titulo}</h4>
      ${descripcion ? `<p class="descripcion">${descripcion}</p>` : ""}
      <div class="opciones-escala" id="opciones_${nombreCampo}">
        ${opciones}
      </div>
      <input type="hidden" id="valor_${nombreCampo}" value="">
    </div>`;
}

function seleccionarOpcion(elemento, nombreCampo, sufijo) {
  const contenedor = document.getElementById(`opciones_${nombreCampo}`);
  contenedor.querySelectorAll(".opcion-escala").forEach(op => op.classList.remove("seleccionada"));
  elemento.classList.add("seleccionada");
  document.getElementById(`valor_${nombreCampo}`).value = elemento.dataset.valor;

  if (sufijo) {
    evaluarNivelDesempeno(sufijo);
  }
}
const ETIQUETAS_ESCALA = [
  { valor: 1, texto: "No aceptable" },
  { valor: 2, texto: "Deficiente" },
  { valor: 3, texto: "Regular" },
  { valor: 4, texto: "Bueno" },
  { valor: 5, texto: "Excelente" }
];
// ========================
// 10. ARMAR PÁGINA 3 SEGÚN RELACIÓN          
// ========================
function armarPagina3(sufijo) {
  const relacion = document.getElementById(`relacion_${sufijo}`).value;
  const cargoEvaluado = document.getElementById(`cargoEvaluado_${sufijo}`).value;

  // --- Bloque 1: Competencias (siempre) ---
  const listaComp = document.getElementById(`listaCompetencias_${sufijo}`);
  listaComp.innerHTML = "";
  COMPETENCIAS.forEach((c, index) => {
    listaComp.innerHTML += crearTarjetaEscala(
      c["Competencias"],
      c["Descripcion"],
      `comp_${sufijo}_${index}`,
      ETIQUETAS_ESCALA,
      sufijo
    );
  });

  const bloqueFunciones = document.getElementById(`bloqueFunciones_${sufijo}`);
  const bloqueGlobal = document.getElementById(`bloqueGlobal_${sufijo}`);

  if (relacion === "JEFE") {
    bloqueFunciones.classList.remove("oculto");
    bloqueGlobal.classList.remove("oculto");
    document.getElementById(`bloqueConclusiones_${sufijo}`).classList.remove("oculto");

    const funcionesDelCargo = FUNCIONES.filter(
      f => normalizar(f["CARGO"]) === normalizar(cargoEvaluado)
    );
    const listaFunc = document.getElementById(`listaFunciones_${sufijo}`);
    listaFunc.innerHTML = "";

    if (funcionesDelCargo.length === 0) {
      listaFunc.innerHTML = `<p style="color:#b30000;">
        Aún no hay funciones cargadas para el cargo "${cargoEvaluado}". Avisa a RRHH.
      </p>`;
    } else {
      funcionesDelCargo.forEach((f, index) => {
        listaFunc.innerHTML += crearTarjetaEscala(
          `Función ${f["Nº"]}`,
          f["FUNCION"],
          `func_${sufijo}_${index}`,
          ETIQUETAS_ESCALA,
          sufijo
        );
      });
    }

    const listaGlobal = document.getElementById(`listaGlobal_${sufijo}`);
    listaGlobal.innerHTML = crearTarjetaEscala(
      "Calificación Integral de Desempeño",
      "Considera el desempeño integral del colaborador durante el periodo evaluado.",
      `global_${sufijo}`,
      ETIQUETAS_ESCALA,
      sufijo
    );

  } else {
    bloqueFunciones.classList.add("oculto");
    bloqueGlobal.classList.add("oculto");
    document.getElementById(`bloqueConclusiones_${sufijo}`).classList.add("oculto");
    const bc = document.getElementById(`bloqueCompromisos_${sufijo}`);
    if (bc) bc.classList.add("oculto");
  }
}

function normalizar(texto) {
  return (texto || "")
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}
function irAPagina3(sufijo) {
  mostrar(`pagina3_${sufijo}`);
  armarPagina3(sufijo);
}

// ========================
// 10b. DETECCIÓN DE BAJO RENDIMIENTO (solo Jefe)
// ========================
function evaluarNivelDesempeno(sufijo) {
  const relacion = document.getElementById(`relacion_${sufijo}`).value;
  const bloqueCompromisos = document.getElementById(`bloqueCompromisos_${sufijo}`);
  if (relacion !== "JEFE" || !bloqueCompromisos) return;

  // Promedio de competencias que el jefe lleva calificadas hasta ahora
  const valoresComp = COMPETENCIAS
    .map((c, index) => document.getElementById(`valor_comp_${sufijo}_${index}`))
    .filter(el => el && el.value)
    .map(el => Number(el.value));

  // Promedio de funciones que el jefe lleva calificadas hasta ahora
  const cargoEvaluado = document.getElementById(`cargoEvaluado_${sufijo}`).value;
  const funcionesDelCargo = FUNCIONES.filter(f => normalizar(f["CARGO"]) === normalizar(cargoEvaluado));
  const valoresFunc = funcionesDelCargo
    .map((f, index) => document.getElementById(`valor_func_${sufijo}_${index}`))
    .filter(el => el && el.value)
    .map(el => Number(el.value));

  // Valoración Integral
  const elGlobal = document.getElementById(`valor_global_${sufijo}`);
  const valorGlobal = elGlobal && elGlobal.value ? Number(elGlobal.value) : null;

  // Solo evaluamos cuando hay al menos una respuesta en cada bloque
  if (valoresComp.length === 0 || (funcionesDelCargo.length > 0 && valoresFunc.length === 0) || valorGlobal === null) {
    bloqueCompromisos.classList.add("oculto");
    return;
  }

  const promComp = valoresComp.reduce((a, b) => a + b, 0) / valoresComp.length;
  const promFunc = valoresFunc.length > 0 ? valoresFunc.reduce((a, b) => a + b, 0) / valoresFunc.length : promComp;

  const compuestoPreliminar = (promComp * 0.30) + (promFunc * 0.50) + (valorGlobal * 0.20);

  if (compuestoPreliminar < 3.0) {
    bloqueCompromisos.classList.remove("oculto");
  } else {
    bloqueCompromisos.classList.add("oculto");
  }
}

// ========================
// 11. ENVÍO DE LA EVALUACIÓN         
// ========================
async function enviarEvaluacion(sufijo) {
  const relacion = document.getElementById(`relacion_${sufijo}`).value;
  const evaluador = document.getElementById(`evaluador_${sufijo}`).value;
  const evaluado = document.getElementById(`evaluado_${sufijo}`).value;
  const cargoEvaluado = document.getElementById(`cargoEvaluado_${sufijo}`).value;
  const comentario = document.getElementById(`comentario_${sufijo}`).value;

  const respuestasCompetencias = COMPETENCIAS.map((c, index) => {
    const val = document.getElementById(`valor_comp_${sufijo}_${index}`).value;
    return { competencia: c["Competencias"], calificacion: val };
  });

  if (respuestasCompetencias.some(r => !r.calificacion)) {
    alert("Por favor califica todas las competencias antes de enviar.");
    return;
  }

  // Validación de campos de Compromisos si el bloque está visible (desempeño bajo)
  let areasMejora = "", accionPropuesta = "", fechaPlazo = "";
  if (relacion === "JEFE") {
    const bloqueCompromisos = document.getElementById(`bloqueCompromisos_${sufijo}`);
    if (bloqueCompromisos && !bloqueCompromisos.classList.contains("oculto")) {
      areasMejora = document.getElementById(`areasMejora_${sufijo}`).value.trim();
      accionPropuesta = document.getElementById(`accionPropuesta_${sufijo}`).value.trim();
      fechaPlazo = document.getElementById(`fechaPlazo_${sufijo}`).value;

      if (!areasMejora || !accionPropuesta || !fechaPlazo) {
        alert("El resultado indica desempeño bajo. Por favor completa Áreas de mejora, Acción propuesta y Fecha plazo antes de enviar.");
        return;
      }
    }
  }

  const resultadoDiv = document.getElementById(`resultadoEnvio_${sufijo}`);
  resultadoDiv.innerHTML = "Enviando...";

  try {
    const payload = {
      tipo: "competencias",
      evaluador, evaluado, relacion, cargoEvaluado, comentario,
      respuestas: respuestasCompetencias
    };
    await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) });

    if (relacion === "JEFE") {
      const funcionesDelCargo = FUNCIONES.filter(
        f => normalizar(f["CARGO"]) === normalizar(cargoEvaluado)
      );
      const respuestasFunciones = funcionesDelCargo.map((f, index) => ({
        funcion: f["FUNCION"],
        calificacion: document.getElementById(`valor_func_${sufijo}_${index}`).value
      }));

      await fetch(API_URL, { method: "POST", body: JSON.stringify({
        tipo: "funciones", evaluador, evaluado, cargoEvaluado, respuestas: respuestasFunciones
      })});

      const globalCalif = document.getElementById(`valor_global_${sufijo}`).value;
      const fortalezas = document.getElementById(`fortalezas_${sufijo}`).value.trim();
      const oportunidades = document.getElementById(`oportunidades_${sufijo}`).value.trim();

      await fetch(API_URL, { method: "POST", body: JSON.stringify({
        tipo: "global", evaluador, evaluado, cargoEvaluado,
        calificacion: globalCalif, comentario,
        areasMejora, accionPropuesta, fechaPlazo,
        fortalezas, oportunidades
      })});
    }

    // Éxito -> mostrar página de agradecimiento, ocultando el formulario
    mostrar("pagina_gracias");

  } catch (error) {
    console.error("Error al enviar la evaluación:", error);
    resultadoDiv.innerHTML = "⚠️ Hubo un problema de conexión al enviar. Por favor intenta de nuevo o avisa a RRHH.";
  }
}
