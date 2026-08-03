function doPost(e) {
  const datos = JSON.parse(e.postData.contents);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let resultado = { ok: true };

  if (datos.tipo === "competencias") {
    const hoja = ss.getSheetByName("Respuestas_Competencias");
    const fila = [new Date(), datos.evaluador, datos.relacion, datos.evaluado, datos.cargoEvaluado, datos.comentario];
    datos.respuestas.forEach(r => fila.push(r.calificacion));
    hoja.appendRow(fila);
  }

  if (datos.tipo === "funciones") {
    const hoja = ss.getSheetByName("Respuestas_Funciones");
    const fila = [new Date(), datos.evaluador, datos.evaluado, datos.cargoEvaluado];
    datos.respuestas.forEach(r => { fila.push(r.funcion); fila.push(r.calificacion); });
    hoja.appendRow(fila);
  }

  if (datos.tipo === "global") {
    const hoja = ss.getSheetByName("Respuestas_Global");
    hoja.appendRow([new Date(), datos.evaluador, datos.evaluado, datos.cargoEvaluado, datos.calificacion, datos.comentario]);

    // El Jefe es quien cierra el ciclo -> generamos el PDF consolidado aquí
    const pdfUrl = generarInformePDF(datos.evaluado, datos.cargoEvaluado);
    resultado.pdfUrl = pdfUrl;
  }

  return ContentService.createTextOutput(JSON.stringify(resultado))
    .setMimeType(ContentService.MimeType.JSON);
}

function generarInformePDF(evaluado, cargo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Promedio de competencias (considerando a todos los evaluadores de esta persona)
  const hojaComp = ss.getSheetByName("Respuestas_Competencias");
  const filasComp = hojaComp.getDataRange().getValues().filter(f => f[3] === evaluado);
  let promedioComp = "N/A";
  if (filasComp.length > 0) {
    const columnasCalif = filasComp[0].slice(6); // desde donde empiezan las calificaciones
    let suma = 0, cuenta = 0;
    filasComp.forEach(f => {
      f.slice(6).forEach(v => { if (v) { suma += Number(v); cuenta++; } });
    });
    promedioComp = cuenta > 0 ? (suma / cuenta).toFixed(1) : "N/A";
  }

  // 2. Última evaluación Global
  const hojaGlobal = ss.getSheetByName("Respuestas_Global");
  const filasGlobal = hojaGlobal.getDataRange().getValues().filter(f => f[2] === evaluado);
  const ultimaGlobal = filasGlobal[filasGlobal.length - 1] || [];

  // 3. Plantilla en Google Docs (reemplaza XXXX por el ID real de tu plantilla)
  const plantilla = DriveApp.getFileById("1jpuS8Nv0p6hr1dtcaribrNck1xGKJ7Mm");
  const copia = plantilla.makeCopy(`Evaluacion_${evaluado}_${new Date().getTime()}`);
  const doc = DocumentApp.openById(copia.getId());
  const body = doc.getBody();

  body.replaceText("{{nombre_evaluado}}", evaluado);
  body.replaceText("{{cargo}}", cargo);
  body.replaceText("{{promedio_competencias}}", promedioComp);
  body.replaceText("{{calificacion_global}}", ultimaGlobal[4] || "N/A");
  body.replaceText("{{comentario_global}}", ultimaGlobal[5] || "");
  body.replaceText("{{fecha}}", new Date().toLocaleDateString());

  doc.saveAndClose();

 const carpeta = DriveApp.getFolderById("1kE3LJKojqC5PTcNN4lfh8f-hvnNVK4vF");
  const pdf = DriveApp.getFileById(copia.getId()).getAs("application/pdf");
  const archivoPdf = carpeta.createFile(pdf);
  DriveApp.getFileById(copia.getId()).setTrashed(true); // borra el Doc temporal

  return archivoPdf.getUrl();
}