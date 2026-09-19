// Config partagée (LEAD_ENDPOINT_URL) chargée depuis js/config.js

const ecLogin = document.getElementById('ecLogin');
const ecDashboard = document.getElementById('ecDashboard');
const ecLoginForm = document.getElementById('ecLoginForm');
const ecLoginNote = document.getElementById('ecLoginNote');
const ecStatus = document.getElementById('ecStatus');
const ecGrid = document.getElementById('ecGrid');
const ecEmpty = document.getElementById('ecEmpty');
const ecTitle = document.getElementById('ecTitle');

const PROJECT_ICONS = {
  'Pompe à chaleur': '🔥',
  'Isolation': '🧱',
  'Panneaux solaires': '☀️',
};

function loadLeads(code) {
  if (typeof LEAD_ENDPOINT_URL === 'undefined' || LEAD_ENDPOINT_URL.includes('REMPLACER_PAR_VOTRE_URL_WEB_APP')) {
    ecLoginNote.textContent = "Configuration en attente : ajoutez l'URL Google Apps Script dans js/config.js (voir README).";
    ecLoginNote.className = 'form-note error';
    return;
  }

  ecLoginNote.textContent = 'Chargement de vos leads...';
  ecLoginNote.className = 'form-note';

  const callbackName = 'ecCallback_' + Date.now();
  const script = document.createElement('script');
  let settled = false;

  const timeout = setTimeout(() => {
    if (settled) return;
    settled = true;
    ecLoginNote.textContent = "Le chargement a échoué. Vérifiez votre connexion et réessayez.";
    ecLoginNote.className = 'form-note error';
    cleanup();
  }, 10000);

  function cleanup() {
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
  }

  window[callbackName] = (response) => {
    if (settled) return;
    settled = true;
    cleanup();
    handleResponse(code, response);
  };

  const url = new URL(LEAD_ENDPOINT_URL);
  url.searchParams.set('code', code);
  url.searchParams.set('callback', callbackName);
  script.src = url.toString();
  script.onerror = () => {
    if (settled) return;
    settled = true;
    cleanup();
    ecLoginNote.textContent = "Impossible de contacter le serveur. Réessayez plus tard.";
    ecLoginNote.className = 'form-note error';
  };
  document.body.appendChild(script);
}

function handleResponse(code, response) {
  if (!response || response.status !== 'ok') {
    ecLoginNote.textContent = (response && response.message) || 'Code invalide.';
    ecLoginNote.className = 'form-note error';
    return;
  }

  if (!response.leads.length) {
    ecLogin.hidden = true;
    ecDashboard.hidden = false;
    ecEmpty.hidden = false;
    ecStatus.textContent = '';
    ecGrid.innerHTML = '';
    return;
  }

  renderLeads(response.leads);
  ecLogin.hidden = true;
  ecDashboard.hidden = false;

  try {
    sessionStorage.setItem('ec_code', code);
  } catch (err) {
    // stockage indisponible (navigation privée...) — sans impact sur l'affichage
  }
}

function renderLeads(leads) {
  ecEmpty.hidden = true;
  ecStatus.textContent = `${leads.length} lead${leads.length > 1 ? 's' : ''} qui vous ${leads.length > 1 ? 'ont' : 'a'} été attribué${leads.length > 1 ? 's' : ''}.`;
  ecGrid.innerHTML = '';

  // Les plus récents en premier
  leads.slice().reverse().forEach((lead) => {
    const card = document.createElement('div');
    card.className = 'ec-card';

    const icon = PROJECT_ICONS[lead.projet] || '⚡';
    const date = lead.dateSoumission ? new Date(lead.dateSoumission).toLocaleDateString('fr-FR') : '';

    card.innerHTML = `
      <div class="ec-card-head">
        <span class="ec-card-tag">${icon} ${escapeHtml(lead.projet || 'Projet')}</span>
        <span class="ec-card-date">${escapeHtml(date)}</span>
      </div>
      <h3>${escapeHtml(lead.prenom || '')} ${escapeHtml(lead.nom || '')}</h3>
      <div class="ec-card-row"><span>Logement</span><span>${escapeHtml(lead.statut || '')} — ${escapeHtml(lead.logement || '')}</span></div>
      <div class="ec-card-row"><span>Code postal</span><span>${escapeHtml(lead.codePostal || '')}</span></div>
      <div class="ec-card-row"><span>Délai</span><span>${escapeHtml(lead.delai || '')}</span></div>
      <div class="ec-card-row"><span>Budget</span><span>${escapeHtml(lead.budget || 'Non précisé')}</span></div>
      <div class="ec-card-contact">
        <a class="call" href="tel:${escapeHtml((lead.telephone || '').replace(/\s+/g, ''))}">📞 Appeler</a>
        <a class="mail" href="mailto:${escapeHtml(lead.email || '')}">✉️ Email</a>
      </div>
    `;
    ecGrid.appendChild(card);
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = value ?? '';
  return div.innerHTML;
}

ecLoginForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const code = document.getElementById('ecCode').value.trim();
  if (!code) return;
  loadLeads(code);
});

// Auto-connexion si un code est passé dans l'URL (?code=...) ou déjà mémorisé
(function autoLogin() {
  const params = new URLSearchParams(window.location.search);
  let code = params.get('code');

  if (!code) {
    try {
      code = sessionStorage.getItem('ec_code');
    } catch (err) {
      code = null;
    }
  }

  if (code) {
    document.getElementById('ecCode').value = code;
    loadLeads(code);
  }
})();

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();
