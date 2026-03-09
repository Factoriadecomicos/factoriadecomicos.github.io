/* ============================================================
   form.js – Fiestas de Pueblos
   ============================================================
   SETUP: paste your Google Apps Script Web App URL below.
   Leave it empty and submissions will just be logged to the
   browser console until you have the URL ready.
   ============================================================ */

const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwJpUZYcmLpdnV4MhroIfaBvCzNHMNutpWSI3PdiAlBHGvCIPPh9VbAOkVULiODDFDG/exec';

// Must match SHARED_SECRET in apps-script.gs
const FORM_SECRET = 'fb153336bb032e5e9c2d781c4ce4bd721f0e432080b67e65';

const STORAGE_KEY = 'fiestas_pueblos_v1';

/* ── State ─────────────────────────────────────────────── */
let steps = [];          // parsed from questions.yaml
let currentStep = 0;     // index into steps[]
let answers = {};        // { fieldId: value, ... }
let goingBack = false;   // direction flag for animation

/* ── DOM refs ──────────────────────────────────────────── */
const formContainer = document.getElementById('formContainer');
const btnBack       = document.getElementById('btnBack');
const btnNext       = document.getElementById('btnNext');
const btnSubmit     = document.getElementById('btnSubmit');
const progressBar   = document.getElementById('progressBar');
const progressLabel = document.getElementById('progressLabel');
const resumeBanner  = document.getElementById('resumeBanner');
const btnResumeYes  = document.getElementById('btnResumeYes');
const btnResumeNo   = document.getElementById('btnResumeNo');
const successScreen = document.getElementById('successScreen');
const successPueblo = document.getElementById('successPueblo');
const toast         = document.getElementById('toast');

/* ── Bootstrap ─────────────────────────────────────────── */
async function init() {
  try {
    const res = await fetch('questions.yaml');
    if (!res.ok) throw new Error('No se pudo cargar questions.yaml');
    const raw = await res.text();
    const parsed = jsyaml.load(raw);
    // Normalise YAML keys to the internal format the rest of the code uses
    steps = parsed.map((s, i) => ({
      type:     i === 0 ? 'intro' : undefined,
      title:    s.titulo,
      subtitle: s.subtitulo,
      fields:   (s.preguntas || []).map(q => ({
        id:          q.id,
        label:       q.pregunta,
        placeholder: q.ejemplo || '',
        required:    q.obligatorio || false,
        type:        q.tipo === 'email' ? 'email' : (q.tipo || 'textarea'),
      })),
    }));
  } catch (err) {
    formContainer.innerHTML = `<p style="color:#A8192E;text-align:center;padding:40px">
      Error al cargar las preguntas: ${err.message}</p>`;
    return;
  }

  buildAllSteps();
  checkSavedProgress();
  updateNav();
  updateProgress();
}

/* ── Build DOM for all steps ────────────────────────────── */
function buildAllSteps() {
  formContainer.innerHTML = '';

  steps.forEach((stepData, idx) => {
    const div = document.createElement('div');
    div.className = 'step' + (stepData.type === 'intro' ? ' step--intro' : '');
    div.id = `step-${idx}`;
    div.setAttribute('role', 'group');
    div.setAttribute('aria-label', `Paso ${idx + 1}`);

    // Badge
    if (stepData.type !== 'intro') {
      const badge = document.createElement('span');
      badge.className = 'step-badge';
      badge.textContent = `Pregunta ${idx} de ${steps.length - 1}`;
      div.appendChild(badge);
    }

    // Title
    const h2 = document.createElement('h2');
    h2.className = 'step-title';
    h2.textContent = stepData.title;
    div.appendChild(h2);

    // Subtitle (intro only)
    if (stepData.subtitle) {
      const sub = document.createElement('p');
      sub.className = 'step-subtitle';
      sub.textContent = stepData.subtitle;
      div.appendChild(sub);
    }

    // Fields
    stepData.fields.forEach(field => {
      div.appendChild(buildField(field));
    });

    formContainer.appendChild(div);
  });

  showStep(currentStep, false);
}

/* ── Build a single field ───────────────────────────────── */
function buildField(field) {
  const wrapper = document.createElement('div');
  wrapper.className = 'field-group';

  const label = document.createElement('label');
  label.className = 'field-label';
  label.setAttribute('for', `field-${field.id}`);
  label.innerHTML = field.label +
    (field.required ? '<span class="required-star" aria-hidden="true">*</span>' : '');
  wrapper.appendChild(label);

  let input;
  if (field.type === 'textarea') {
    input = document.createElement('textarea');
    input.className = 'field-textarea';
    input.rows = 3;
  } else {
    input = document.createElement('input');
    input.type = field.type || 'text';
    input.className = 'field-input';
  }

  input.id = `field-${field.id}`;
  input.name = field.id;
  input.placeholder = field.placeholder || '';
  if (field.required) input.setAttribute('aria-required', 'true');

  // Restore saved value
  if (answers[field.id] !== undefined) input.value = answers[field.id];

  // Auto-save on change
  input.addEventListener('input', () => {
    answers[field.id] = input.value;
    saveProgress();
    clearError(input);
  });

  // Advance on Enter (single-line inputs only)
  if (field.type !== 'textarea') {
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); handleNext(); }
    });
  }

  wrapper.appendChild(input);

  // Error message placeholder
  const errMsg = document.createElement('span');
  errMsg.className = 'field-error-msg';
  errMsg.id = `err-${field.id}`;
  errMsg.setAttribute('role', 'alert');
  wrapper.appendChild(errMsg);

  return wrapper;
}

/* ── Show a specific step ───────────────────────────────── */
function showStep(idx, animate = true) {
  const allSteps = formContainer.querySelectorAll('.step');

  allSteps.forEach(s => {
    s.classList.remove('active', 'slide-back');
    s.style.display = 'none';
  });

  const target = formContainer.querySelector(`#step-${idx}`);
  if (!target) return;

  if (animate) {
    if (goingBack) target.classList.add('slide-back');
    // Re-trigger animation
    void target.offsetWidth;
  }

  target.style.display = 'block';
  target.classList.add('active');

  // Focus first input for accessibility
  const firstInput = target.querySelector('input, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 80);

  currentStep = idx;
}

/* ── Navigation ─────────────────────────────────────────── */
function handleNext() {
  if (!validateCurrentStep()) return;
  if (currentStep < steps.length - 1) {
    goingBack = false;
    showStep(currentStep + 1);
    updateNav();
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function handleBack() {
  if (currentStep > 0) {
    goingBack = true;
    showStep(currentStep - 1);
    updateNav();
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

btnNext.addEventListener('click', handleNext);
btnBack.addEventListener('click', handleBack);

/* ── Update nav buttons & progress ─────────────────────── */
function updateNav() {
  const isFirst = currentStep === 0;
  const isLast  = currentStep === steps.length - 1;

  btnBack.disabled = isFirst;
  btnNext.style.display   = isLast ? 'none' : '';
  btnSubmit.style.display = isLast ? '' : 'none';
}

function updateProgress() {
  const pct = steps.length <= 1
    ? 100
    : Math.round((currentStep / (steps.length - 1)) * 100);
  progressBar.style.width = pct + '%';
  progressBar.parentElement.setAttribute('aria-valuenow', pct);
  progressLabel.textContent = `Paso ${currentStep + 1} de ${steps.length}`;
}

/* ── Validation ─────────────────────────────────────────── */
function validateCurrentStep() {
  const stepData = steps[currentStep];
  let valid = true;

  stepData.fields.forEach(field => {
    if (!field.required) return;
    const input = document.getElementById(`field-${field.id}`);
    if (!input) return;
    if (!input.value.trim()) {
      showError(input, field.id, 'Este campo es obligatorio');
      valid = false;
    }
  });

  // Extra: email format check
  const emailInput = document.getElementById('field-email');
  if (emailInput && emailInput.closest(`#step-${currentStep}`)) {
    const val = emailInput.value.trim();
    if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      showError(emailInput, 'email', 'Introduce un email válido');
      valid = false;
    }
  }

  return valid;
}

function showError(input, fieldId, msg) {
  input.classList.add('error');
  const errEl = document.getElementById(`err-${fieldId}`);
  if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
  input.focus();
}

function clearError(input) {
  input.classList.remove('error');
  const errEl = document.getElementById(`err-${input.name}`);
  if (errEl) errEl.classList.remove('visible');
}

/* ── localStorage ───────────────────────────────────────── */
function saveProgress() {
  const data = { step: currentStep, answers };
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (_) {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (_) { return null; }
}

function clearProgress() {
  try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
}

function checkSavedProgress() {
  const saved = loadProgress();
  if (!saved || saved.step === 0) return;

  resumeBanner.style.display = 'flex';

  btnResumeYes.addEventListener('click', () => {
    answers = saved.answers || {};
    currentStep = saved.step;
    // Re-populate inputs with saved values
    repopulateAllFields();
    showStep(currentStep, false);
    updateNav();
    updateProgress();
    resumeBanner.style.display = 'none';
  });

  btnResumeNo.addEventListener('click', () => {
    clearProgress();
    answers = {};
    resumeBanner.style.display = 'none';
  });
}

function repopulateAllFields() {
  Object.entries(answers).forEach(([id, value]) => {
    const el = document.getElementById(`field-${id}`);
    if (el) el.value = value;
  });
}

/* ── Submit ─────────────────────────────────────────────── */
btnSubmit.addEventListener('click', async () => {
  if (!validateCurrentStep()) return;

  // Build flat payload
  const payload = { _secret: FORM_SECRET, timestamp: new Date().toISOString(), ...answers };

  // Show sending overlay
  const overlay = document.createElement('div');
  overlay.className = 'sending-overlay';
  overlay.innerHTML = '<div class="spinner"></div><span>Enviando respuestas…</span>';
  formContainer.appendChild(overlay);
  btnSubmit.disabled = true;

  try {
    if (GOOGLE_SCRIPT_URL) {
      const res = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // required for Apps Script Web App
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      // no-cors means we can't read the response; assume success if no throw
    } else {
      // Dev mode: log and simulate delay
      console.log('[Fiestas de Pueblos] Submission payload:', payload);
      await new Promise(r => setTimeout(r, 1000));
    }

    clearProgress();

    // Show success
    successPueblo.textContent = answers.pueblo || 'tu pueblo';
    successScreen.style.display = 'flex';

  } catch (err) {
    console.error('Submit error:', err);
    showToast('Hubo un error al enviar. Por favor inténtalo de nuevo.');
    btnSubmit.disabled = false;
  } finally {
    overlay.remove();
  }
});

/* ── Toast helper ───────────────────────────────────────── */
function showToast(msg, duration = 4000) {
  toast.textContent = msg;
  toast.style.display = 'block';
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => { toast.style.display = 'none'; }, duration);
}

/* ── Keyboard shortcut: Ctrl/Cmd+Enter to advance ──────── */
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (btnNext.style.display !== 'none') handleNext();
  }
});

/* ── Start ──────────────────────────────────────────────── */
init();
