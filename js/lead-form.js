// Config partagée (LEAD_ENDPOINT_URL) chargée depuis js/config.js

const form = document.getElementById('leadCaptureForm');
const steps = Array.from(document.querySelectorAll('.lp-step'));
const progressBar = document.getElementById('lpProgressBar');
const formNote = document.getElementById('formNote');
const totalSteps = 4; // le step 5 est l'écran de confirmation, pas compté dans la progression
let currentStep = 1;

function showStep(stepNumber) {
  steps.forEach((step) => {
    step.classList.toggle('active', Number(step.dataset.step) === stepNumber);
  });
  const pct = Math.min((stepNumber / totalSteps) * 100, 100);
  if (progressBar) progressBar.style.width = pct + '%';
  currentStep = stepNumber;
}

function stepIsValid(stepNumber) {
  const stepEl = steps.find((s) => Number(s.dataset.step) === stepNumber);
  if (!stepEl) return true;
  const fields = stepEl.querySelectorAll('input[required], select[required]');
  let valid = true;

  fields.forEach((field) => {
    if (field.type === 'radio') {
      const group = stepEl.querySelectorAll(`input[name="${field.name}"]`);
      const checked = Array.from(group).some((r) => r.checked);
      if (!checked) valid = false;
    } else if (!field.checkValidity()) {
      field.reportValidity();
      valid = false;
    }
  });

  return valid;
}

document.querySelectorAll('.lp-next').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!stepIsValid(currentStep)) return;
    if (currentStep < totalSteps) showStep(currentStep + 1);
  });
});

document.querySelectorAll('.lp-prev').forEach((btn) => {
  btn.addEventListener('click', () => {
    if (currentStep > 1) showStep(currentStep - 1);
  });
});

// Pré-remplissage des champs de tracking (utile pour les campagnes Google/Facebook Ads)
const sourceField = document.getElementById('source');
const pageUrlField = document.getElementById('pageUrl');
if (sourceField) {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  const utmCampaign = params.get('utm_campaign');
  sourceField.value = [utmSource, utmCampaign].filter(Boolean).join(' / ') || 'Direct';
}
if (pageUrlField) pageUrlField.value = window.location.href;

form?.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!stepIsValid(4)) return;

  const consent = document.getElementById('consent');
  if (consent && !consent.checked) {
    formNote.textContent = "Merci d'accepter d'être recontacté(e) pour valider votre demande.";
    formNote.className = 'form-note error';
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Envoi en cours...';

  const data = new FormData(form);
  const payload = new URLSearchParams();
  data.forEach((value, key) => payload.append(key, value.toString()));
  payload.append('dateSoumission', new Date().toISOString());

  try {
    if (!LEAD_ENDPOINT_URL || LEAD_ENDPOINT_URL.includes('REMPLACER_PAR_VOTRE_URL_WEB_APP')) {
      throw new Error('endpoint-not-configured');
    }

    // mode 'no-cors' : Google Apps Script ne renvoie pas d'en-têtes CORS.
    // La requête part bien vers la Sheet, mais la réponse n'est pas lisible ici.
    await fetch(LEAD_ENDPOINT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload.toString(),
    });

    showStep(5);
  } catch (err) {
    if (err.message === 'endpoint-not-configured') {
      formNote.textContent = "Configuration en attente : ajoutez votre URL Google Apps Script dans js/lead-form.js (voir README).";
    } else {
      formNote.textContent = "Une erreur est survenue. Merci de réessayer ou de nous appeler directement.";
    }
    formNote.className = 'form-note error';
    submitBtn.disabled = false;
    submitBtn.textContent = 'Recevoir mon devis gratuit';
  }
});

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
