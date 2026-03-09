// ============================================================
// Google Apps Script – Fiestas de Pueblos
// ============================================================
// HOW TO SET UP:
//
// 1. Open your Google Sheet.
// 2. Click Extensions → Apps Script.
// 3. Delete any existing code and paste this entire file.
// 4. Save (Ctrl+S).
// 5. Click Deploy → New deployment.
//    - Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 6. Click Deploy, then Authorize.
// 7. Copy the Web App URL shown after deployment.
// 8. Paste it into form.js as the value of GOOGLE_SCRIPT_URL.
//
// SECURITY: The SHARED_SECRET below must match the value of
// FORM_SECRET in form.js. Requests that don't include the
// correct secret are rejected before touching the spreadsheet.
// If you ever rotate the secret, update it in both files and
// redeploy this script.
//
// NOTE: Every time you change this script you must create a
// NEW deployment (or update the existing one) — the URL stays
// the same if you update the same deployment.
// ============================================================

const SHARED_SECRET = 'fb153336bb032e5e9c2d781c4ce4bd721f0e432080b67e65';

// Column order for the spreadsheet header row.
// This list controls which columns are created and in what order.
// Add or remove field IDs here if you change questions.json.
const FIELD_ORDER = [
  'timestamp',
  'pueblo',
  'nombre',
  'email',
  'gentilicio',
  'apodo_gente',
  'palabras_locales',
  'num_habitantes',
  'num_barrios',
  'nombre_barrios',
  'motes_comunes',
  'pueblos_rivales',
  'grado_rivalidad',
  'anecdota_rival',
  'burla_rival',
  'nombre_rival',
  'pareja_longeva',
  'parejas_foraneas',
  'refranes',
  'calle_divertida',
  'plaza_famosa',
  'num_rotondas',
  'rotonda_polemica',
  'proyecto_polemico',
  'monumentos',
  'famosos_pueblo',
  'establecimiento_tipico',
  'num_bares',
  'bar_tipico',
  'plato_tipico',
  'bebida_tipica',
  'bebida_apodo',
  'nombre_alcalde',
  'partido_politico',
  'tiempo_gobernando',
  'anecdota_alcalde',
  'personaje_tipico',
  'nombre_comun',
  'nombre_caracteristico',
  'eslogan',
  'hermanamiento',
  'famoso_visita',
  'patron',
  'que_se_celebra',
  'unicas_fiestas',
  'acto_significativo',
  'leyenda_ninos',
  'google_maps',
  'fiesta_loca',
  'banda_sonora',
  'nunca_hacer',
  'sabe_todo',
  'frase_local',
  'tele_pueblo',
  'lugar_miedo',
  'edificio_surreal',
  'secreto_voces',
  'chisme_grande',
  'alcalde_bar',
  'paredes_plaza',
  'rincon_otro_pueblo',
  'cagada_famosa',
  'queja_absurda',
  'personaje_netflix',
  'pregunta_dominguero',
  'personaje_alma',
  'rincon_secreto',
  'leyenda_absurda',
  'extranjeros',
  'argumento_extranjero',
];

// ── Main handler ─────────────────────────────────────────

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // ── Secret check ──────────────────────────────────────
    if (data._secret !== SHARED_SECRET) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: 'error', message: 'Unauthorized' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getOrCreateSheet();
    ensureHeader(sheet);

    const row = FIELD_ORDER.map(key => (data[key] !== undefined ? data[key] : ''));

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Allow GET requests so you can test the URL in a browser
function doGet() {
  return ContentService
    .createTextOutput('Fiestas de Pueblos – endpoint activo ✓')
    .setMimeType(ContentService.MimeType.TEXT);
}

// ── Helpers ──────────────────────────────────────────────

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('Respuestas');
  if (!sheet) {
    sheet = ss.insertSheet('Respuestas');
  }
  return sheet;
}

function ensureHeader(sheet) {
  // Only write the header if row 1 is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(FIELD_ORDER);
    // Freeze header row and make it bold
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, FIELD_ORDER.length).setFontWeight('bold');
  }
}
